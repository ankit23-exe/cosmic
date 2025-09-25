#!/usr/bin/env node

import * as dotenv from 'dotenv';
dotenv.config();
import { processWebUrl, processMultipleUrls } from './webScraper.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('\n🕸️  Web Scraper CLI Tool');
  console.log('========================\n');
  
  try {
    // Check environment variables
    if (!process.env.GEMINI_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      console.error('❌ Missing required environment variables:');
      if (!process.env.GEMINI_API_KEY) console.error('   - GEMINI_API_KEY');
      if (!process.env.PINECONE_INDEX_NAME) console.error('   - PINECONE_INDEX_NAME');
      console.log('\nPlease check your .env file and try again.');
      process.exit(1);
    }
    
    const mode = await askQuestion('Choose mode:\n1. Single URL\n2. Multiple URLs\n3. Exit\n\nEnter your choice (1-3): ');
    
    switch (mode.trim()) {
      case '1':
        await handleSingleUrl();
        break;
      case '2':
        await handleMultipleUrls();
        break;
      case '3':
        console.log('👋 Goodbye!');
        break;
      default:
        console.log('❌ Invalid choice. Please run the script again.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

async function handleSingleUrl() {
  const url = await askQuestion('\n📎 Enter the URL to scrape: ');
  
  if (!url.trim()) {
    console.log('❌ URL cannot be empty.');
    return;
  }
  
  try {
    new URL(url.trim());
  } catch (error) {
    console.log('❌ Invalid URL format.');
    return;
  }
  
  console.log('\n🔄 Processing URL...');
  
  try {
    const result = await processWebUrl(url.trim());
    console.log('\n✅ Success!');
    console.log(`📄 Content length: ${result.contentLength} characters`);
    console.log(`🧩 Chunks created: ${result.chunksCreated}`);
    console.log(`🔗 URL: ${result.url}`);
  } catch (error) {
    console.log('\n❌ Failed to process URL:', error.message);
  }
}

async function handleMultipleUrls() {
  console.log('\n📎 Enter URLs one by one. Type "done" when finished:');
  
  const urls = [];
  let urlIndex = 1;
  
  while (true) {
    const url = await askQuestion(`URL ${urlIndex}: `);
    
    if (url.trim().toLowerCase() === 'done') {
      break;
    }
    
    if (!url.trim()) {
      console.log('❌ URL cannot be empty. Try again or type "done".');
      continue;
    }
    
    try {
      new URL(url.trim());
      urls.push(url.trim());
      urlIndex++;
    } catch (error) {
      console.log('❌ Invalid URL format. Try again or type "done".');
    }
  }
  
  if (urls.length === 0) {
    console.log('❌ No valid URLs provided.');
    return;
  }
  
  console.log(`\n🔄 Processing ${urls.length} URLs...`);
  
  try {
    const results = await processMultipleUrls(urls);
    
    console.log('\n📊 Results Summary:');
    console.log('==================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successful URLs:');
      successful.forEach((result, index) => {
        console.log(`${index + 1}. ${result.url}`);
        console.log(`   📄 Content: ${result.contentLength} chars`);
        console.log(`   🧩 Chunks: ${result.chunksCreated}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed URLs:');
      failed.forEach((result, index) => {
        console.log(`${index + 1}. ${result.url}`);
        console.log(`   Error: ${result.error}`);
      });
    }
    
  } catch (error) {
    console.log('\n❌ Failed to process URLs:', error.message);
  }
}

// Run the CLI
main();