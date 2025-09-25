import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import webScraperRoutes from './routes/webScraperRoutes.js';
import { chattingGPT } from './controllers/chatControllerGpt.js'; //GPT wallah

const app = express();
const PORT = process.env.PORT || 8080;



// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/scrape', webScraperRoutes);



// Chat route (preserved)
app.post('/chat', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  try {
    const answer = await chattingGPT(question);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});