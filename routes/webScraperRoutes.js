import express from 'express';
import { 
  scrapeSingleUrl, 
  scrapeMultipleUrls, 
  getScraperStatus 
} from '../controllers/webScraperController.js';

const router = express.Router();

/**
 * @route GET /scrape/status
 * @desc Get web scraper status
 */
router.get('/status', getScraperStatus);

/**
 * @route POST /scrape/url
 * @desc Scrape a single URL and store in Pinecone
 * @body { url: string }
 */
router.post('/url', scrapeSingleUrl);

/**
 * @route POST /scrape/urls
 * @desc Scrape multiple URLs and store in Pinecone
 * @body { urls: string[] }
 */
router.post('/urls', scrapeMultipleUrls);

export default router;