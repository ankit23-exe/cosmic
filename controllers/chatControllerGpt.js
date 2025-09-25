import { ChatOpenAI } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
dotenv.config();
const History = [];

// Use GPT to rewrite the user's question into a standalone English query
export async function transformQueryGPT(question, history = []) {
  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: "gpt-5-mini", //gpt-4o
    temperature: 0.2,
  });
    const prompt = `You are a query rewriting expert. Given the chat history and the latest user question, rephrase the latest question into a complete, standalone English question that can be understood without any chat history.  Only output the rewritten question and nothing else.`;
  // Pass history as context if available
  const messages = [
    { role: 'system', content: prompt },
      ...history,
    { role: 'user', content: question }
  ];
  const response = await llm.invoke(messages);
  return response.content;
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
  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: "gpt-5-mini", //gpt-4o
    temperature: 0.2,
  });
  const prompt = `You are Astrea, the official AI assistant for NASA's Space Biology       Knowledge Engine.Your goal is to help scientists, mission planners, and researchers explore NASA's bioscience publications efficiently.If the user greets, greet them warmly and ask how you can assist with space biology research. When a user asks a question:- Use the provided context (summarized publications, experiments, findings) to answer.  - If the context does not contain enough information, reply:I could not find sufficient information in the current dataset. Please refer to NASA's Open Science Data Repository for more details." Always keep answers: - Clear and concise ,Focused on the users query ,Structured with sections like 'Key Findings', 'Experiments', 'Missions', 'Links' when possible ,In the same language as the query if multilingual queries are supported. When relationships between experiments, organisms, and missions are available, highlight them clearly so they can be visualized in a knowledge graph. Context: ${context}`;
  const messages = [
    { role: 'system', content: prompt },
    ...history,
    { role: 'user', content: question }
  ];
  const response = await llm.invoke(messages);

  // Update history for this session
  history.push({ role: 'user', content: question });
  history.push({ role: 'assistant', content: response.content });

  return response.content;
}



