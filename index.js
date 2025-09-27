import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import webScraperRoutes from './routes/webScraperRoutes.js';
import { chattingGPT } from './controllers/chatControllerGpt.js'; //GPT wallah
import TelegramBot from "node-telegram-bot-api";

const app = express();
const PORT = process.env.PORT || 8080;



// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/scrape', webScraperRoutes);



// Chat route with structured response
app.post('/chat', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  try {
    const response = await chattingGPT(question);
    
    // Format answer into sections if it's a text response
    let formattedAnswer = response.answer;
    if (typeof formattedAnswer === 'string' && !formattedAnswer.includes('Key Findings:')) {
      formattedAnswer = `Key Findings:\n${formattedAnswer}\n\nExperiments:\n- ${response.graph?.nodes?.filter(n => n.type === 'Experiment')?.map(n => n.label)?.join('\n- ') || 'No specific experiments found'}\n\nMissions:\n- ${response.graph?.nodes?.filter(n => n.type === 'Mission')?.map(n => n.label)?.join('\n- ') || 'No specific missions found'}\n\nLinks:\n- ${response.graph?.edges?.map(e => `${e.source} ${e.label} ${e.target}`)?.join('\n- ') || 'No specific relationships found'}`;
    }

    res.json({
      answer: formattedAnswer,
      graph: response.graph || {
        nodes: [],
        edges: []
      }
    });
  } catch (err) {
    res.status(500).json({ 
      answer: "An error occurred while processing your request.",
      graph: {
        nodes: [],
        edges: []
      },
      error: err.message 
    });
  }
});

// Clean chat route for Telegram bot - returns only raw answer
app.post('/chat/telegram', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  try {
    const response = await chattingGPT(question);
    
    // Return only the raw answer without extra formatting
    res.json({
      answer: response.answer
    });
  } catch (err) {
    res.status(500).json({ 
      answer: "An error occurred while processing your request.",
      error: err.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



//🚀 Telegram Bot Integration (POLLING MODE)
if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const userMessage = msg.text;

        if (!userMessage) return;

        try {
            // Call the clean chat route for Telegram
            const response = await axios.post(`http://localhost:${PORT}/chat/telegram`, {
                question: userMessage,
            });

            const reply = response.data.answer || "No answer available.";
            bot.sendMessage(chatId, reply);
        } catch (error) {
            console.error("Telegram bot error:", error.message);
            bot.sendMessage(chatId, "⚠️ Something went wrong, please try again.");
        }
    });

    console.log("🤖 Telegram bot is running...");
} else {
    console.log("⚠️ TELEGRAM_BOT_TOKEN not set in .env, skipping Telegram bot setup.");
}

