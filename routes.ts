import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertBotResponseSchema, insertFacebookSettingsSchema, type Message, type ServiceIntent } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

interface FacebookMessage {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message: {
    mid: string;
    text: string;
  };
}

interface FacebookWebhookEntry {
  id: string;
  time: number;
  messaging: FacebookMessage[];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat API Routes
  app.get("/api/conversations/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const conversation = await storage.getConversationByUserId(userId);
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const messageSchema = z.object({
        text: z.string(),
        sender: z.enum(['user', 'bot']),
        language: z.enum(['ar', 'fr']).optional()
      });
      
      const { text, sender, language } = messageSchema.parse(req.body);
      const message: Message = {
        id: crypto.randomUUID(),
        text,
        sender,
        timestamp: Date.now(),
        language
      };

      const success = await storage.addMessageToConversation(id, message);
      if (!success) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // If user message, generate bot response
      let botResponse = null;
      if (sender === 'user') {
        const intent = await analyzeIntent(text);
        const response = await generateBotResponse(intent, language || 'ar');
        if (response) {
          const botMessage: Message = {
            id: crypto.randomUUID(),
            text: response,
            sender: 'bot',
            timestamp: Date.now(),
            language
          };
          await storage.addMessageToConversation(id, botMessage);
          botResponse = botMessage;
        }
      }

      res.json({ message, botResponse });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Bot Response Management
  app.get("/api/bot-responses", async (req: Request, res: Response) => {
    try {
      const responses = await storage.getAllBotResponses();
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bot-responses", async (req: Request, res: Response) => {
    try {
      const validatedData = insertBotResponseSchema.parse(req.body);
      const response = await storage.createBotResponse(validatedData);
      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/bot-responses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = insertBotResponseSchema.partial().parse(req.body);
      const response = await storage.updateBotResponse(id, updates);
      if (!response) {
        return res.status(404).json({ message: "Bot response not found" });
      }
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/bot-responses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteBotResponse(id);
      if (!success) {
        return res.status(404).json({ message: "Bot response not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Facebook Integration
  app.get("/api/facebook-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getFacebookSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/facebook-settings", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFacebookSettingsSchema.parse(req.body);
      const settings = await storage.updateFacebookSettings(validatedData);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Facebook Webhook
  app.get("/webhook/messenger", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe") {
      storage.getFacebookSettings().then(settings => {
        if (settings && token === settings.verifyToken) {
          res.status(200).send(challenge);
        } else {
          res.status(403).send("Forbidden");
        }
      });
    } else {
      res.status(400).send("Bad Request");
    }
  });

  app.post("/webhook/messenger", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      
      if (body.object === "page") {
        for (const entry of body.entry as FacebookWebhookEntry[]) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message) {
              await handleFacebookMessage(messagingEvent);
            }
          }
        }
      }
      
      res.status(200).send("EVENT_RECEIVED");
    } catch (error: any) {
      console.error("Facebook webhook error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Analytics
  app.get("/api/stats/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const stats = await storage.getChatStats(date);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stats/today", async (req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = await storage.getChatStats(today);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Intent Analysis API
  app.post("/api/analyze-intent", async (req: Request, res: Response) => {
    try {
      const { text } = z.object({ text: z.string() }).parse(req.body);
      const intent = await analyzeIntent(text);
      res.json(intent);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper Functions
async function analyzeIntent(text: string): Promise<ServiceIntent> {
  const normalizedText = text.toLowerCase();
  const responses = await storage.getAllBotResponses();
  
  let bestMatch: ServiceIntent = {
    intent: "unknown",
    confidence: 0,
    category: "general"
  };

  for (const response of responses) {
    const keywords = Array.isArray(response.keywords) ? response.keywords : [];
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        const confidence = keyword.length / text.length;
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: response.intent,
            confidence,
            category: response.category as any
          };
        }
      }
    }
  }

  return bestMatch;
}

async function generateBotResponse(intent: ServiceIntent, language: 'ar' | 'fr'): Promise<string | null> {
  if (intent.confidence < 0.1) {
    return language === 'ar' 
      ? "عذراً، لم أفهم استفساركم. يمكنكم التواصل مع خدمة العملاء على 600"
      : "Désolé, je n'ai pas compris votre demande. Vous pouvez contacter le service client au 600";
  }

  const response = await storage.getBotResponseByIntent(intent.intent);
  if (!response) return null;

  return language === 'ar' ? response.responseAr : response.responseFr;
}

async function handleFacebookMessage(messagingEvent: FacebookMessage) {
  const senderId = messagingEvent.sender.id;
  const messageText = messagingEvent.message.text;

  // Get or create conversation
  let conversation = await storage.getConversationByUserId(senderId);
  if (!conversation) {
    conversation = await storage.createConversation({
      userId: senderId,
      platform: 'messenger',
      messages: [],
      isActive: true
    });
  }

  // Add user message
  const userMessage: Message = {
    id: crypto.randomUUID(),
    text: messageText,
    sender: 'user',
    timestamp: messagingEvent.timestamp,
    language: 'ar' // Default to Arabic for Facebook messages
  };
  
  await storage.addMessageToConversation(conversation.id, userMessage);

  // Generate and send bot response
  const intent = await analyzeIntent(messageText);
  const botResponseText = await generateBotResponse(intent, 'ar');
  
  if (botResponseText) {
    const botMessage: Message = {
      id: crypto.randomUUID(),
      text: botResponseText,
      sender: 'bot',
      timestamp: Date.now(),
      language: 'ar'
    };
    
    await storage.addMessageToConversation(conversation.id, botMessage);
    
    // Send response back to Facebook
    await sendFacebookMessage(senderId, botResponseText);
  }
}

async function sendFacebookMessage(recipientId: string, messageText: string) {
  const settings = await storage.getFacebookSettings();
  if (!settings || !settings.pageAccessToken) {
    console.error("Facebook settings not configured");
    return;
  }

  const messageData = {
    recipient: { id: recipientId },
    message: { text: messageText }
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v12.0/me/messages?access_token=${settings.pageAccessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending Facebook message:", error);
  }
}
