import { ChatOpenAI } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import neo4j from 'neo4j-driver';
import * as dotenv from 'dotenv';
dotenv.config();
const History = [];

// Initialize Neo4j driver
function getNeo4jDriver() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;
  if (!uri || !user || !password) {
    console.warn('Neo4j env missing (NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD)');
    return null;
  }
  return neo4j.driver(uri, neo4j.auth.basic(user, password), { disableLosslessIntegers: true });
}

// Query Neo4j for relevant graph data
async function getGraphData(query, context) {
  const driver = getNeo4jDriver();
  if (!driver) return null;

  const session = driver.session({ database: process.env.NEO4J_DATABASE || undefined });
  try {
    // Extract potential entities from context for graph query
    const entityLLM = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
      temperature: 0,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1"
      }
    });    const extractPrompt = `
    Given this context and query, extract key entities that might exist in our knowledge graph.
    Focus on: Mission names, Groups, Mouse IDs, Training types, Diet types, Habitats, Measurements, Tissues, Methods, and Outcomes.
    Return ONLY a comma-separated list of potential entity names, no other text.
    
    Query: ${query}
    Context: ${context}
    `;
    
    const entities = await entityLLM.invoke([
      { role: 'system', content: extractPrompt }
    ]);
    
    const entityList = entities.content.split(',').map(e => e.trim());
    
    // Query graph for paths containing these entities
    const graphQuery = `
    MATCH path = (n:Entity)-[r*1..3]-(m:Entity)
    WHERE n.name IN $entities OR m.name IN $entities
    WITH path, relationships(path) as rels
    RETURN path
    LIMIT 10
    `;
    
    const result = await session.run(graphQuery, { entities: entityList });
    
    // Transform results into the desired visualization format
    const nodes = new Set();
    const edges = new Set();
    
    result.records.forEach(record => {
      const path = record.get('path');
      path.segments.forEach(segment => {
        // Add nodes with label and score
        nodes.add({
          id: segment.start.elementId,
          label: segment.start.properties.name,
          type: segment.start.properties.type,
          score: segment.start.properties.confidence || 1.0
        });
        nodes.add({
          id: segment.end.elementId,
          label: segment.end.properties.name,
          type: segment.end.properties.type,
          score: segment.end.properties.confidence || 1.0
        });
        // Add edges with evidence
        edges.add({
          source: segment.start.elementId,
          target: segment.end.elementId,
          label: segment.relationship.type,
          evidence: segment.relationship.properties.docIds || []
        });
      });
    });

    return {
      nodes: Array.from(nodes),
      edges: Array.from(edges),
    };

  } catch (error) {
    console.error('Neo4j query error:', error);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Use GPT to rewrite the user's question into a standalone English query
export async function transformQueryGPT(question, history = []) {
  const rewriteLLM = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0.2,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1"
    }
  });
  
  const rewritePrompt = `You are a query rewriting expert. Given the chat history and the latest user question, rephrase the latest question into a complete, standalone English question that can be understood without any chat history.  Only output the rewritten question and nothing else.`;
  
  const rewriteMessages = [
    { role: 'system', content: rewritePrompt },
    ...history,
    { role: 'user', content: question }
  ];
  
  const rewriteResponse = await rewriteLLM.invoke(rewriteMessages);
  return rewriteResponse.content;
}

// In-memory chat history per session (for demo; use a better store for production)
const sessionHistories = {};

export async function chattingGPT(question, sessionId = 'default') {
  // Get or initialize history for this session
  if (!sessionHistories[sessionId]) sessionHistories[sessionId] = [];
  const history = sessionHistories[sessionId];

  // Step 1: Rewrite the question to English using GPT, with history
  const rewrittenQuery = await transformQueryGPT(question, history);

  // Step 2: Embed the rewritten query and search Pinecone
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'text-embedding-004',
  });
  const queryVector = await embeddings.embedQuery(rewrittenQuery);
  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  const searchResults = await pineconeIndex.query({
    topK: 10,
    vector: queryVector,
    includeMetadata: true,
  });
  const context = searchResults.matches
    .map(match => match.metadata.text)
    .join("\n\n---\n\n");

  // If no context found, return fallback message
  if (!context || context.trim().length === 0) {
    const fallback = "I couldn’t find the details right now. Maybe not present in the document I Have. ";
    history.push({ role: 'user', content: question });
    history.push({ role: 'assistant', content: fallback });
    return fallback;
  }

  // Step 3: Use the original user question and found context for the final answer, with history
  const finalLLM = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0.2,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1"
    }
  });
  
  const finalPrompt = `You are Astrea, the official AI assistant for NASA's Space Biology Knowledge Engine.Your goal is to help scientists, mission planners, and researchers explore NASA's bioscience publications efficiently.If the user greets, greet them warmly and ask how you can assist with space biology research. When a user asks a question:- Use the provided context (summarized publications, experiments, findings) to answer.  - If the context does not contain enough information, reply:I could not find sufficient information in the current dataset. Please refer to NASA's Open Science Data Repository for more details." Always keep answers: - Clear and concise ,Focused on the users query ,Structured with sections like 'Key Findings', 'Experiments', 'Missions', 'Links' when possible ,In the same language as the query if multilingual queries are supported. When relationships between experiments, organisms, and missions are available, highlight them clearly so they can be visualized in a knowledge graph. Context: ${context}`;
  
  const finalMessages = [
    { role: 'system', content: finalPrompt },
    ...history,
    { role: 'user', content: question }
  ];
  
  const finalResponse = await finalLLM.invoke(finalMessages);

  // Update history for this session
  history.push({ role: 'user', content: question });
  
  // Get graph data
  const graphData = await getGraphData(question, context);
  
  // Structure the response with both text and graph data
  const structuredResponse = {
    answer: finalResponse.content,
    graph: graphData,
  };
  
  history.push({ role: 'assistant', content: JSON.stringify(structuredResponse) });

  return structuredResponse;
}



