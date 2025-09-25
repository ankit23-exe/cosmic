# ASTREA Web Scraper

A powerful web scraping tool that extracts content from web pages, chunks it, creates embeddings, and stores them in Pinecone DB for semantic search and retrieval.

## Features

- 🕸️ **Web Scraping**: Extract clean text content from any web page
- 🧩 **Intelligent Chunking**: Split content into optimal chunks for processing
- 🤖 **AI Embeddings**: Generate embeddings using Google's Gemini AI
- 📦 **Pinecone Storage**: Store embeddings in Pinecone vector database
- 🚀 **Multiple Interfaces**: API endpoints, CLI tool, and direct function calls
- 📄 **PDF Support**: Also supports PDF document processing (via embedder.js)

## Prerequisites

1. **Environment Variables**: Create a `.env` file in the root directory with:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PINECONE_INDEX_NAME=your_pinecone_index_name
   PORT=8080
   ```

2. **APIs Setup**:
   - Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Set up a Pinecone account and create an index at [Pinecone](https://www.pinecone.io/)

## Installation

```bash
cd astrea
npm install
```

## Usage

### 1. REST API Endpoints

Start the server:
```bash
npm start
# or for development
npm run dev
```

#### Available Endpoints:

**Check Scraper Status:**
```
GET http://localhost:8080/scrape/status
```

**Scrape Single URL:**
```
POST http://localhost:8080/scrape/url
Content-Type: application/json

{
  "url": "https://example.com/article"
}
```

**Scrape Multiple URLs:**
```
POST http://localhost:8080/scrape/urls
Content-Type: application/json

{
  "urls": [
    "https://example.com/article1",
    "https://example.com/article2",
    "https://example.com/article3"
  ]
}
```

**Chat with processed content:**
```
POST http://localhost:8080/chat
Content-Type: application/json

{
  "question": "What information do you have about AI?"
}
```

### 2. Command Line Interface

Interactive CLI tool:
```bash
npm run scraper-cli
```

The CLI will guide you through:
1. Choosing single or multiple URL mode
2. Entering URLs to scrape
3. Monitoring the processing progress

### 3. Direct Function Usage

```javascript
import { processWebUrl, processMultipleUrls } from './webScraper.js';

// Process a single URL
const result = await processWebUrl('https://example.com/article');
console.log(`Created ${result.chunksCreated} chunks from ${result.url}`);

// Process multiple URLs
const urls = ['https://site1.com', 'https://site2.com'];
const results = await processMultipleUrls(urls);
results.forEach(result => {
  if (result.success) {
    console.log(`✅ ${result.url}: ${result.chunksCreated} chunks`);
  } else {
    console.log(`❌ ${result.url}: ${result.error}`);
  }
});
```

### 4. Test the Scraper

Run the test file to verify everything works:
```bash
npm run test-scraper
```

## How It Works

1. **Web Scraping**: 
   - Fetches webpage content using Axios
   - Parses HTML with Cheerio
   - Extracts clean text from main content areas
   - Removes navigation, ads, scripts, and styling

2. **Content Processing**:
   - Creates Document objects with metadata (URL, timestamp, type)
   - Splits content into overlapping chunks (1000 chars with 200 char overlap)
   - Preserves context between chunks

3. **Embedding Generation**:
   - Uses Google's Gemini text-embedding-004 model
   - Converts text chunks into high-dimensional vectors

4. **Vector Storage**:
   - Stores embeddings in Pinecone with metadata
   - Enables semantic search and retrieval
   - Supports concurrent uploads for efficiency

## Content Extraction Strategy

The scraper uses intelligent content extraction:

1. **Priority Selectors**: Looks for main content in this order:
   - `<main>` tags
   - `<article>` tags
   - `.content`, `.main-content` classes
   - `.post-content`, `.entry-content` classes
   - `<body>` as fallback

2. **Content Cleaning**:
   - Removes scripts, styles, navigation, footers
   - Filters out advertisements and promotional content
   - Normalizes whitespace and formatting

3. **Quality Checks**:
   - Validates extracted content length
   - Ensures meaningful content is captured
   - Provides detailed error messages for failures

## Project Structure

```
astrea/
├── embedder.js              # PDF document processing
├── webScraper.js            # Core web scraping functionality
├── webScraperCli.js         # Interactive CLI tool
├── testWebScraper.js        # Test examples
├── index.js                 # Express server
├── controllers/
│   ├── chatControllerGpt.js # Chat functionality
│   └── webScraperController.js # Web scraper API controllers
└── routes/
    └── webScraperRoutes.js  # API route definitions
```

## Error Handling

The system includes comprehensive error handling:

- **Network errors**: Timeout, connection issues, invalid URLs
- **Content errors**: Empty pages, parsing failures, insufficient content
- **API errors**: Invalid API keys, rate limiting, service unavailability
- **Storage errors**: Pinecone connection issues, indexing failures

Each error provides detailed messages to help diagnose and resolve issues.

## Performance Considerations

- **Concurrent Processing**: Supports processing multiple URLs with controlled concurrency
- **Chunking Strategy**: Optimized chunk sizes for embedding quality and retrieval performance
- **Rate Limiting**: Built-in delays and retry logic for API calls
- **Memory Management**: Efficient processing of large content volumes

## Troubleshooting

### Common Issues:

1. **"Missing required environment variables"**
   - Check your `.env` file has `GEMINI_API_KEY` and `PINECONE_INDEX_NAME`

2. **"Failed to scrape content"**
   - Verify the URL is accessible
   - Some sites block automated requests
   - Check your internet connection

3. **"Insufficient content extracted"**
   - The webpage might be JavaScript-heavy
   - Content might be behind authentication
   - Try different URLs

4. **API quota exceeded**
   - Check your Gemini API usage limits
   - Verify your Pinecone plan limits

## Contributing

1. Fork the repository
2. Create your feature branch
3. Test your changes thoroughly
4. Submit a pull request

## License

This project is licensed under the ISC License.