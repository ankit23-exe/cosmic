import * as dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import * as cheerio from 'cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';

/**
 * Scrapes content from a web page and extracts text
 * @param {string} url - The URL to scrape
 * @returns {Promise<string>} - The extracted text content
 */
async function scrapeWebContent(url) {
  try {
    console.log(`Scraping content from: ${url}`);
    
    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 second timeout
    });

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('footer').remove();
    $('.advertisement').remove();
    $('.ads').remove();
    
    // Extract text from main content areas
    let content = '';
    
    // Try to get main content from common selectors
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      'body'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0 && element.text().trim().length > 100) {
        content = element.text().trim();
        break;
      }
    }
    
    // If no main content found, get all text from body
    if (!content) {
      content = $('body').text().trim();
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();
    
    console.log(`Extracted ${content.length} characters from ${url}`);
    return content;
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    throw new Error(`Failed to scrape content from ${url}: ${error.message}`);
  }
}

/**
 * Processes a web URL by scraping, chunking, embedding, and storing in Pinecone
 * @param {string} url - The URL to process
 * @returns {Promise<void>}
 */
async function processWebUrl(url) {
  try {
    // Step 1: Scrape the web content
    const content = await scrapeWebContent(url);
    
    if (!content || content.length < 50) {
      throw new Error('Insufficient content extracted from the webpage');
    }
    
    // Step 2: Create a document object
    const document = new Document({
      pageContent: content,
      metadata: {
        source: url,
        type: 'web_scrape',
        timestamp: new Date().toISOString(),
        url: url
      }
    });
    
    // Step 3: Split the document into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    console.log('Chunking the scraped content...');
    const chunkedDocs = await textSplitter.splitDocuments([document]);
    console.log(`Created ${chunkedDocs.length} chunks from the content`);
    
    // Step 4: Initialize embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'text-embedding-004',
    });
    console.log('Embedding model configured');
    
    // Step 5: Initialize Pinecone
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    console.log('Pinecone configured');
    
    // Step 6: Store in Pinecone
    console.log('Storing embeddings in Pinecone...');
    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });
    
    console.log(`Successfully processed and stored content from ${url}`);
    return {
      success: true,
      url: url,
      chunksCreated: chunkedDocs.length,
      contentLength: content.length
    };
    
  } catch (error) {
    console.error(`Error processing ${url}:`, error.message);
    throw error;
  }
}

/**
 * Processes multiple URLs
 * @param {string[]} urls - Array of URLs to process
 * @returns {Promise<Array>} - Array of results
 */
async function processMultipleUrls(urls) {
  const results = [];
  
  for (const url of urls) {
    try {
      console.log(`\n--- Processing ${url} ---`);
      const result = await processWebUrl(url);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        url: url,
        error: error.message
      });
    }
  }
  
  return results;
}

// Export functions for use in other modules
export { scrapeWebContent, processWebUrl, processMultipleUrls };

// If running this file directly, you can test it
if (import.meta.url === new URL(import.meta.resolve('./')).href + 'webScraper.js') {
  // Example usage - uncomment and modify as needed
  /*
  const testUrl = 'https://example.com/article';
  processWebUrl(testUrl)
    .then(result => console.log('Processing complete:', result))
    .catch(error => console.error('Processing failed:', error));
  */
}