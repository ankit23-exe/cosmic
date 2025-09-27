


import * as dotenv from 'dotenv';
dotenv.config();
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';

import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf';

import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';

// ---- Knowledge Graph helpers (Neo4j + Triple extraction) ----
function getNeo4jDriver() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;
  if (!uri || !user || !password) {
    console.warn('Neo4j env missing (NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD); skipping KG ingestion.');
    return null;
  }
  return neo4j.driver(uri, neo4j.auth.basic(user, password), { disableLosslessIntegers: true });
}

function stripCodeFences(s = '') {
  return s.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
}

// ---- Helpers for canonicalization and relation normalization ----
function canonicalizeName(name) {
  if (!name) return '';
  return String(name).trim().replace(/\s+/g, ' ');
}

function toCanonicalKey(name) {
  return canonicalizeName(name).toLowerCase();
}

function normalizeRelType(subjectType, objectType, predicate) {
  const p = (predicate || '').toUpperCase().replace(/[^A-Z_]/g, '_');
  const allowed = new Set(['HAS_GROUP','CONTAINS','UNDERWENT','FED','HOUSED_IN','HAS_MEASUREMENT','SAMPLED_FOR','ANALYZED_BY','RESULTED_IN','CONDUCTED']);
  if (allowed.has(p)) return p;
  // Type-driven mapping
  if (subjectType === 'Mission' && objectType === 'Group') return 'HAS_GROUP';
  if (subjectType === 'Group' && objectType === 'Mouse') return 'CONTAINS';
  if (subjectType === 'Mouse' && objectType === 'Training') return 'UNDERWENT';
  if (subjectType === 'Mouse' && objectType === 'Diet') return 'FED';
  if (subjectType === 'Mouse' && objectType === 'Habitat') return 'HOUSED_IN';
  if (subjectType === 'Mouse' && objectType === 'Measurement') return 'HAS_MEASUREMENT';
  if (subjectType === 'Mouse' && objectType === 'Tissue') return 'SAMPLED_FOR';
  if (subjectType === 'Tissue' && objectType === 'Method') return 'ANALYZED_BY';
  if (subjectType === 'Mouse' && objectType === 'Outcome') return 'RESULTED_IN';
  if (subjectType === 'Institution' && objectType === 'Mission') return 'CONDUCTED';
  return 'RELATES_TO';
}

async function extractTriplesFromChunk(model, text, meta) {
  const prompt = `
You are extracting a domain-specific knowledge graph for mouse spaceflight experiments.

1) Identify Entity Types (Nodes) from this controlled set:
   Mission | Group | Mouse | Training | Diet | Habitat | Measurement | Tissue | Method | Outcome | Institution

2) Define Relationship Templates (Edges) using ONLY these types:
   (:Mission)-[:HAS_GROUP]->(:Group)
   (:Group)-[:CONTAINS]->(:Mouse)
   (:Mouse)-[:UNDERWENT]->(:Training)
   (:Mouse)-[:FED]->(:Diet)
   (:Mouse)-[:HOUSED_IN]->(:Habitat)
   (:Mouse)-[:HAS_MEASUREMENT]->(:Measurement)
   (:Mouse)-[:SAMPLED_FOR]->(:Tissue)
   (:Tissue)-[:ANALYZED_BY]->(:Method)
   (:Mouse)-[:RESULTED_IN]->(:Outcome)
   (:Institution)-[:CONDUCTED]->(:Mission)

Rules:
- Prefer concrete, specific entities (e.g., Bion-M1 mission, SF group, Mouse IDs, specific tissues/methods/measurements).
- If a relation doesn't fit the templates, omit it.
- Use concise names; keep acronyms (ISS, NASA) uppercase. Avoid pronouns.
- Confidence between 0 and 1.

Return ONLY valid JSON in this shape:
{
  "entities": [
    { "name": string, "type": string }
  ],
  "relations": [
    { "subject": string, "subjectType": string, "predicate": string, "object": string, "objectType": string, "confidence": number }
  ]
}

Text:
"""${(text || '').slice(0, 5000)}"""
`;

  const res = await model.invoke(prompt);
  let raw;
  if (typeof res === 'string') raw = res;
  else if (Array.isArray(res?.content)) {
    raw = res.content.map(p => (typeof p === 'string' ? p : p?.text ?? '')).join('').trim();
  } else raw = res?.content ?? '';

  let data;
  try {
    data = JSON.parse(stripCodeFences(raw));
  } catch {
    data = { entities: [], relations: [] };
  }
  const relations = Array.isArray(data.relations) ? data.relations : [];

  // Map to rows we ingest; add canonical keys and normalized relation types
  return relations
    .map(r => {
      const subject = canonicalizeName(r.subject);
      const object = canonicalizeName(r.object);
      const subjectType = (r.subjectType || '').trim();
      const objectType = (r.objectType || '').trim();
      const relType = normalizeRelType(subjectType, objectType, r.predicate);
      return {
        subject,
        subjectCanonical: toCanonicalKey(subject),
        subjectType,
        relType,
        object,
        objectCanonical: toCanonicalKey(object),
        objectType,
        confidence: typeof r.confidence === 'number' ? r.confidence : 0.7,
        source: {
          docId: meta.docId || meta.source || '',
          title: meta.title || '',
          url: meta.url || meta.source || '',
        },
      };
    })
    .filter(t => t.subject && t.object && t.relType);
}

async function ingestTriplesToNeo4j(driver, triples) {
  if (!driver || !triples.length) return;
  const session = driver.session({ database: process.env.NEO4J_DATABASE || undefined });
  try {
    const query = `
UNWIND $rows AS row
// Base nodes with generic label for uniqueness and rich properties
MERGE (s:Entity {name: row.subject})
  ON CREATE SET s.canonical = row.subjectCanonical,
                s.type = row.subjectType,
                s.types = CASE WHEN row.subjectType IS NULL OR row.subjectType = '' THEN [] ELSE [row.subjectType] END,
                s.docIds = CASE WHEN row.source.docId IS NULL OR row.source.docId = '' THEN [] ELSE [row.source.docId] END,
                s.titles = CASE WHEN row.source.title IS NULL OR row.source.title = '' THEN [] ELSE [row.source.title] END,
                s.urls   = CASE WHEN row.source.url   IS NULL OR row.source.url   = '' THEN [] ELSE [row.source.url]   END,
                s.firstSeen = timestamp(),
                s.count = 1
  ON MATCH SET s.canonical = coalesce(s.canonical, row.subjectCanonical),
               s.type = coalesce(s.type, row.subjectType),
               s.types = coalesce(s.types, []) + row.subjectType,
               s.docIds = coalesce(s.docIds, []) + row.source.docId,
               s.titles = coalesce(s.titles, []) + row.source.title,
               s.urls   = coalesce(s.urls,   []) + row.source.url,
               s.lastSeen = timestamp(),
               s.count = coalesce(s.count, 0) + 1

MERGE (o:Entity {name: row.object})
  ON CREATE SET o.canonical = row.objectCanonical,
                o.type = row.objectType,
                o.types = CASE WHEN row.objectType IS NULL OR row.objectType = '' THEN [] ELSE [row.objectType] END,
                o.docIds = CASE WHEN row.source.docId IS NULL OR row.source.docId = '' THEN [] ELSE [row.source.docId] END,
                o.titles = CASE WHEN row.source.title IS NULL OR row.source.title = '' THEN [] ELSE [row.source.title] END,
                o.urls   = CASE WHEN row.source.url   IS NULL OR row.source.url   = '' THEN [] ELSE [row.source.url]   END,
                o.firstSeen = timestamp(),
                o.count = 1
  ON MATCH SET o.canonical = coalesce(o.canonical, row.objectCanonical),
               o.type = coalesce(o.type, row.objectType),
               o.types = coalesce(o.types, []) + row.objectType,
               o.docIds = coalesce(o.docIds, []) + row.source.docId,
               o.titles = coalesce(o.titles, []) + row.source.title,
               o.urls   = coalesce(o.urls,   []) + row.source.url,
               o.lastSeen = timestamp(),
               o.count = coalesce(o.count, 0) + 1

// Apply type labels via FOREACH (no APOC required)
FOREACH (_ IN CASE WHEN row.subjectType = 'Mission' THEN [1] ELSE [] END | SET s:Mission)
FOREACH (_ IN CASE WHEN row.subjectType = 'Group' THEN [1] ELSE [] END | SET s:Group)
FOREACH (_ IN CASE WHEN row.subjectType = 'Mouse' THEN [1] ELSE [] END | SET s:Mouse)
FOREACH (_ IN CASE WHEN row.subjectType = 'Training' THEN [1] ELSE [] END | SET s:Training)
FOREACH (_ IN CASE WHEN row.subjectType = 'Diet' THEN [1] ELSE [] END | SET s:Diet)
FOREACH (_ IN CASE WHEN row.subjectType = 'Habitat' THEN [1] ELSE [] END | SET s:Habitat)
FOREACH (_ IN CASE WHEN row.subjectType = 'Measurement' THEN [1] ELSE [] END | SET s:Measurement)
FOREACH (_ IN CASE WHEN row.subjectType = 'Tissue' THEN [1] ELSE [] END | SET s:Tissue)
FOREACH (_ IN CASE WHEN row.subjectType = 'Method' THEN [1] ELSE [] END | SET s:Method)
FOREACH (_ IN CASE WHEN row.subjectType = 'Outcome' THEN [1] ELSE [] END | SET s:Outcome)
FOREACH (_ IN CASE WHEN row.subjectType = 'Institution' THEN [1] ELSE [] END | SET s:Institution)

FOREACH (_ IN CASE WHEN row.objectType = 'Mission' THEN [1] ELSE [] END | SET o:Mission)
FOREACH (_ IN CASE WHEN row.objectType = 'Group' THEN [1] ELSE [] END | SET o:Group)
FOREACH (_ IN CASE WHEN row.objectType = 'Mouse' THEN [1] ELSE [] END | SET o:Mouse)
FOREACH (_ IN CASE WHEN row.objectType = 'Training' THEN [1] ELSE [] END | SET o:Training)
FOREACH (_ IN CASE WHEN row.objectType = 'Diet' THEN [1] ELSE [] END | SET o:Diet)
FOREACH (_ IN CASE WHEN row.objectType = 'Habitat' THEN [1] ELSE [] END | SET o:Habitat)
FOREACH (_ IN CASE WHEN row.objectType = 'Measurement' THEN [1] ELSE [] END | SET o:Measurement)
FOREACH (_ IN CASE WHEN row.objectType = 'Tissue' THEN [1] ELSE [] END | SET o:Tissue)
FOREACH (_ IN CASE WHEN row.objectType = 'Method' THEN [1] ELSE [] END | SET o:Method)
FOREACH (_ IN CASE WHEN row.objectType = 'Outcome' THEN [1] ELSE [] END | SET o:Outcome)
FOREACH (_ IN CASE WHEN row.objectType = 'Institution' THEN [1] ELSE [] END | SET o:Institution)

// Relationship creation per allowed type; fallback to RELATES_TO
FOREACH (_ IN CASE WHEN row.relType = 'HAS_GROUP' THEN [1] ELSE [] END |
  MERGE (s)-[r:HAS_GROUP]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
FOREACH (_ IN CASE WHEN row.relType = 'CONTAINS' THEN [1] ELSE [] END |
  MERGE (s)-[r:CONTAINS]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
FOREACH (_ IN CASE WHEN row.relType = 'UNDERWENT' THEN [1] ELSE [] END |
  MERGE (s)-[r:UNDERWENT]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
FOREACH (_ IN CASE WHEN row.relType = 'FED' THEN [1] ELSE [] END |
  MERGE (s)-[r:FED]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
FOREACH (_ IN CASE WHEN row.relType = 'HOUSED_IN' THEN [1] ELSE [] END |
  MERGE (s)-[r:HOUSED_IN]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
FOREACH (_ IN CASE WHEN row.relType = 'HAS_MEASUREMENT' THEN [1] ELSE [] END |
  MERGE (s)-[r:HAS_MEASUREMENT]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
FOREACH (_ IN CASE WHEN row.relType = 'SAMPLED_FOR' THEN [1] ELSE [] END |
  MERGE (s)-[r:SAMPLED_FOR]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
FOREACH (_ IN CASE WHEN row.relType = 'ANALYZED_BY' THEN [1] ELSE [] END |
  MERGE (s)-[r:ANALYZED_BY]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
FOREACH (_ IN CASE WHEN row.relType = 'RESULTED_IN' THEN [1] ELSE [] END |
  MERGE (s)-[r:RESULTED_IN]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
FOREACH (_ IN CASE WHEN row.relType = 'CONDUCTED' THEN [1] ELSE [] END |
  MERGE (s)-[r:CONDUCTED]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
// Generic fallback if relType isn't recognized
FOREACH (_ IN CASE WHEN row.relType IS NULL OR NOT row.relType IN ['HAS_GROUP','CONTAINS','UNDERWENT','FED','HOUSED_IN','HAS_MEASUREMENT','SAMPLED_FOR','ANALYZED_BY','RESULTED_IN','CONDUCTED'] THEN [1] ELSE [] END |
  MERGE (s)-[r:RELATES_TO {predicate: row.relType}]->(o)
  ON CREATE SET r.confidence = row.confidence, r.firstSeen = timestamp(), r.docIds = [row.source.docId], r.titles = [row.source.title], r.urls = [row.source.url]
  ON MATCH SET  r.confidence = (coalesce(r.confidence, 0.7) + row.confidence)/2.0,
                r.docIds    = coalesce(r.docIds, []) + row.source.docId,
                r.titles    = coalesce(r.titles, []) + row.source.title,
                r.urls      = coalesce(r.urls, []) + row.source.url,
                r.lastSeen  = timestamp()
)
RETURN count(*) as upserts
`;
    await session.run(query, { rows: triples });
  } finally {
    await session.close();
  }
}

// Ensure uniqueness/indexes for cleaner, faster merges (runs once, safe if repeated)
async function ensureNeo4jConstraints(driver) {
  if (!driver) return;
  const session = driver.session({ database: process.env.NEO4J_DATABASE || undefined });
  try {
    await session.run(
      'CREATE CONSTRAINT entity_name_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE'
    );
    await session.run(
      'CREATE INDEX rel_predicate IF NOT EXISTS FOR ()-[r:RELATES_TO]-() ON (r.predicate)'
    );
  } catch (e) {
    console.warn('Neo4j constraint/index setup warning:', e.message);
  } finally {
    await session.close();
  }
}

async function buildAndIngestKGFromChunks(docs) {
  const driver = getNeo4jDriver();
  if (!driver) return;

//gpt model 

  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    temperature: 0,
    configuration:{
      baseURL:"https://openrouter.ai/api/v1",
    }
  });

//


  // Set up constraints/indexes (idempotent)
  await ensureNeo4jConstraints(driver);

  const batchSize = 100;
  let buffer = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const meta = {
      docId: doc.metadata?.docId || doc.metadata?.source,
      title: doc.metadata?.title,
      url: doc.metadata?.url,
      source: doc.metadata?.source,
    };
    try {
      const triples = await extractTriplesFromChunk(model, doc.pageContent || '', meta);
      buffer.push(...triples);
    } catch (e) {
      console.warn('KG extraction error:', e.message);
    }

    if (buffer.length >= batchSize || i === docs.length - 1) {
      try {
        await ingestTriplesToNeo4j(driver, buffer);
        console.log(`KG: upserted ${buffer.length} triples (doc ${i + 1}/${docs.length})`);
      } catch (e) {
        console.warn('Neo4j ingestion error:', e.message);
      }
      buffer = [];
    }
  }

  await driver.close();
  console.log('KG: ingestion complete.');
}

async function indexDocuments() {

   
  const documentsDir = path.isAbsolute(process.env.DOCUMENTS_DIR || '')
    ? process.env.DOCUMENTS_DIR
    : path.join(process.cwd(), process.env.DOCUMENTS_DIR || 'documents');
  const files = fs.readdirSync(documentsDir).filter(file => file.endsWith('.pdf'));
  if (files.length === 0) {
    console.log('No PDF files found in documents folder.');
    return;
  }

  const allChunkedDocs = [];
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  for (const file of files) {
    const filePath = path.join(documentsDir, file);
    const pdfLoader = new PDFLoader(filePath);
    const rawDocs = await pdfLoader.load();
    console.log(`Loaded: ${file}`);
    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);

    // Enrich chunk metadata for cross-linking (Pinecone <-> Neo4j)
    const base = path.basename(file);
    for (const ch of chunkedDocs) {
      const page = ch.metadata?.loc?.pageNumber;
      ch.metadata = {
        ...ch.metadata,
        source: filePath,
        title: base,
        docId: page ? `${base}#p${page}` : base,
      };
    }

    allChunkedDocs.push(...chunkedDocs);
    console.log(`Chunked: ${file}`);
  }

 
  if ((process.env.BUILD_KG || 'true').toLowerCase() !== 'false') {
    console.log('Starting KG extraction and Neo4j ingestion...');
    await buildAndIngestKGFromChunks(allChunkedDocs);
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'text-embedding-004',
  });
  console.log('Embedding model configured');

  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  console.log('Pinecone configured');

  await PineconeStore.fromDocuments(allChunkedDocs, embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });
  console.log('All data stored successfully');
}

indexDocuments();
