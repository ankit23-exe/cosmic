import { processWebUrl, processMultipleUrls } from '../webScraper.js';

/**
 * Controller function to handle single URL scraping
 */
export async function scrapeSingleUrl(req, res) {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        message: 'Please provide a URL to scrape'
      });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid URL format',
        message: 'Please provide a valid URL'
      });
    }
    
    console.log(`Received request to scrape: ${url}`);
    
    // Process the URL
    const result = await processWebUrl(url);
    
    res.json({
      message: 'URL processed successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error in scrapeSingleUrl:', error);
    res.status(500).json({
      error: 'Failed to process URL',
      message: error.message
    });
  }
}

/**
 * Controller function to handle multiple URLs scraping
 */
export async function scrapeMultipleUrls(req, res) {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ 
        error: 'URLs array is required',
        message: 'Please provide an array of URLs to scrape'
      });
    }
    
    // Validate URLs format
    for (const url of urls) {
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid URL format',
          message: `Invalid URL: ${url}`
        });
      }
    }
    
    console.log(`Received request to scrape ${urls.length} URLs`);
    
    // Process all URLs
    const results = await processMultipleUrls(urls);
    
    // Count successful and failed operations
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    res.json({
      message: `Processed ${urls.length} URLs: ${successful} successful, ${failed} failed`,
      summary: {
        total: urls.length,
        successful: successful,
        failed: failed
      },
      results: results
    });
    
  } catch (error) {
    console.error('Error in scrapeMultipleUrls:', error);
    res.status(500).json({
      error: 'Failed to process URLs',
      message: error.message
    });
  }
}

/**
 * Controller function to get scraper status/health check
 */
export async function getScraperStatus(req, res) {
  try {
    // Check if required environment variables are set
    const requiredEnvVars = ['GEMINI_API_KEY', 'PINECONE_INDEX_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return res.status(503).json({
        status: 'error',
        message: 'Missing required environment variables',
        missingVars: missingVars
      });
    }
    
    res.json({
      status: 'ready',
      message: 'Web scraper is ready to process URLs',
      features: [
        'Single URL scraping',
        'Multiple URLs scraping',
        'Content chunking',
        'Embedding generation',
        'Pinecone storage'
      ],
      endpoints: {
        single: 'POST /scrape/url',
        multiple: 'POST /scrape/urls',
        status: 'GET /scrape/status'
      }
    });
    
  } catch (error) {
    console.error('Error in getScraperStatus:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}