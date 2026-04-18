import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API Route: Send message to Discord via Webhook or Bot
app.post("/api/chat/send", async (req, res) => {
  const { content } = req.body;
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.WEBHOOK_DEFAULT;
  let botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  // Clean bot token - extract just the token part if user included "Bot "
  if (botToken && botToken.startsWith("Bot ")) {
    botToken = botToken.replace("Bot ", "").trim();
  }

  // Favor Bot API if Token + Channel exist (Shows the "APP" badge)
  if (botToken && channelId) {
    try {
      await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        { 
          content,
          allowed_mentions: { parse: ["everyone", "roles", "users"] }
        },
        {
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      return res.json({ status: "ok", provider: "bot" });
    } catch (error: any) {
      console.error("Bot send failed, falling back to Webhook:", error.response?.data || error.message);
    }
  }

  // Fallback to Webhook
  if (!webhookUrl) {
    console.warn("No Discord provider configured. Message would have been:", content);
    return res.status(200).json({ status: "simulated", content });
  }

  try {
    await axios.post(webhookUrl, {
      content,
      username: "EternalSMP",
      avatar_url: "https://github.com/marcellnw/eternalsmpid/blob/main/Gallery/profile%20bot/gibran.jpeg?raw=true",
      allowed_mentions: { parse: ["everyone", "roles", "users"] }
    });
    res.json({ status: "ok", provider: "webhook" });
  } catch (error) {
    console.error("Error sending to Discord:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// API Route: Check connection status
app.get("/api/chat/status", (req, res) => {
  const isWebhookConfigured = !!(process.env.DISCORD_WEBHOOK_URL || process.env.WEBHOOK_DEFAULT);
  const isBotConfigured = !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID);
  
  res.json({
    status: isWebhookConfigured && isBotConfigured ? "live" : "simulated",
    webhook: isWebhookConfigured,
    bot: isBotConfigured
  });
});

// API Route: Get recent messages from Discord Channel
app.get("/api/chat/messages", async (req, res) => {
  const channelId = process.env.DISCORD_CHANNEL_ID;
  let botToken = process.env.DISCORD_BOT_TOKEN;

  if (botToken && botToken.startsWith("Bot ")) {
    botToken = botToken.replace("Bot ", "").trim();
  }

  if (!channelId || !botToken) {
    // Mock data if not configured
    return res.json([
      {
        id: "1",
        author: { username: "System", discriminator: "0000" },
        content: "*Discord integration pending configuration. Use .env.example to set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID.*",
        timestamp: new Date().toISOString()
      },
      {
        id: "2",
        author: { username: "Sentinel_01", discriminator: "1234" },
        content: "Observation: Core efficiency at 99.8%. No anomalies detected.",
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ]);
  }

  try {
    const response = await axios.get(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=50`,
      {
        headers: {
          Authorization: `Bot ${botToken}`
        }
      }
    );
    
    const messages = Array.isArray(response.data) ? response.data : [];
    res.json(messages);
  } catch (error: any) {
    if (error.response?.data?.code === 50001) {
      console.warn(`[Discord API] Missing Access on channel ${channelId}. Check bot permissions.`);
    } else {
      console.error("Error fetching Discord messages:", error.response?.data || error.message);
    }
    
    // If it's an access error, return a helpful system message in an array
    if (error.response?.status === 403 || error.response?.status === 401) {
      const isMissingAccess = error.response?.data?.code === 50001;
      return res.json([
        {
          id: `err-${Date.now()}`,
          author: { username: "System", discriminator: "0000" },
          content: isMissingAccess 
            ? "🚫 **MISSING ACCESS (50001)**: Bot is not in the channel or lacks 'View Channel' permissions."
            : "⚠️ **CORE ACCESS FORBIDDEN**: Bot lacks 'Read Message History' or token is invalid.",
          timestamp: new Date().toISOString()
        }
      ]);
    }
    
    // Return empty array on other errors to prevent frontend crash
    res.status(error.response?.status || 500).json([]);
  }
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Start only if not on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}

export default app;
