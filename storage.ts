import { 
  type Conversation, 
  type InsertConversation,
  type BotResponse,
  type InsertBotResponse,
  type FacebookSettings,
  type InsertFacebookSettings,
  type ChatStats,
  type InsertChatStats,
  type Message
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationByUserId(userId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  
  // Bot Responses
  getAllBotResponses(): Promise<BotResponse[]>;
  getBotResponseByIntent(intent: string): Promise<BotResponse | undefined>;
  createBotResponse(response: InsertBotResponse): Promise<BotResponse>;
  updateBotResponse(id: string, updates: Partial<BotResponse>): Promise<BotResponse | undefined>;
  deleteBotResponse(id: string): Promise<boolean>;
  
  // Facebook Settings
  getFacebookSettings(): Promise<FacebookSettings | undefined>;
  updateFacebookSettings(settings: InsertFacebookSettings): Promise<FacebookSettings>;
  
  // Chat Stats
  getChatStats(date: string): Promise<ChatStats | undefined>;
  updateChatStats(date: string, stats: Partial<InsertChatStats>): Promise<ChatStats>;
  
  // Message operations
  addMessageToConversation(conversationId: string, message: Message): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private conversations: Map<string, Conversation>;
  private botResponses: Map<string, BotResponse>;
  private facebookSettings: FacebookSettings | undefined;
  private chatStats: Map<string, ChatStats>;

  constructor() {
    this.conversations = new Map();
    this.botResponses = new Map();
    this.chatStats = new Map();
    
    // Initialize with default bot responses
    this.initializeDefaultResponses();
    this.initializeTodayStats();
  }

  private initializeDefaultResponses() {
    const defaultResponses: InsertBotResponse[] = [
      {
        intent: "balance_inquiry",
        keywords: ["رصيد", "balance", "solde", "credit"],
        responseAr: "يمكنكم الاستعلام عن رصيدكم عبر الاتصال بـ *555# أو عبر تطبيق موبليس",
        responseFr: "Vous pouvez consulter votre solde en composant *555# ou via l'application Mobilis",
        category: "balance",
        isActive: true
      },
      {
        intent: "recharge",
        keywords: ["شحن", "recharge", "rechargement", "credit"],
        responseAr: "يمكنكم شحن رصيدكم عبر بطاقات الشحن أو عبر التطبيق المصرفي",
        responseFr: "Vous pouvez recharger via les cartes de recharge ou l'application bancaire",
        category: "recharge",
        isActive: true
      },
      {
        intent: "plans",
        keywords: ["باقة", "باقات", "forfait", "plans", "abonnement"],
        responseAr: "لدينا باقات متنوعة للمكالمات والإنترنت. اتصل بـ 600 للمزيد من التفاصيل",
        responseFr: "Nous avons diverses offres d'appels et internet. Appelez le 600 pour plus de détails",
        category: "plans",
        isActive: true
      },
      {
        intent: "support",
        keywords: ["مساعدة", "دعم", "aide", "support", "problème", "مشكلة"],
        responseAr: "فريق الدعم الفني متاح على 600 من 8:00 إلى 20:00",
        responseFr: "Le support technique est disponible au 600 de 8h00 à 20h00",
        category: "support",
        isActive: true
      },
      {
        intent: "greeting",
        keywords: ["مرحبا", "أهلا", "السلام", "bonjour", "salut", "hello"],
        responseAr: "مرحباً بكم في خدمة عملاء موبليس! كيف يمكنني مساعدتكم؟",
        responseFr: "Bienvenue chez Mobilis! Comment puis-je vous aider?",
        category: "general",
        isActive: true
      }
    ];

    defaultResponses.forEach(response => {
      const id = randomUUID();
      this.botResponses.set(id, { ...response, id });
    });
  }

  private initializeTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const stats: ChatStats = {
      id: randomUUID(),
      date: today,
      totalConversations: "324",
      resolvedQueries: "289",
      balanceInquiries: "156",
      averageResponses: "2.3"
    };
    this.chatStats.set(today, stats);
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationByUserId(userId: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      (conv) => conv.userId === userId && conv.isActive
    );
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated = { ...conversation, ...updates, updatedAt: new Date() };
    this.conversations.set(id, updated);
    return updated;
  }

  async getAllBotResponses(): Promise<BotResponse[]> {
    return Array.from(this.botResponses.values()).filter(r => r.isActive);
  }

  async getBotResponseByIntent(intent: string): Promise<BotResponse | undefined> {
    return Array.from(this.botResponses.values()).find(
      r => r.intent === intent && r.isActive
    );
  }

  async createBotResponse(response: InsertBotResponse): Promise<BotResponse> {
    const id = randomUUID();
    const botResponse: BotResponse = {
      ...response,
      id,
      createdAt: new Date(),
    };
    this.botResponses.set(id, botResponse);
    return botResponse;
  }

  async updateBotResponse(id: string, updates: Partial<BotResponse>): Promise<BotResponse | undefined> {
    const response = this.botResponses.get(id);
    if (!response) return undefined;
    
    const updated = { ...response, ...updates };
    this.botResponses.set(id, updated);
    return updated;
  }

  async deleteBotResponse(id: string): Promise<boolean> {
    return this.botResponses.delete(id);
  }

  async getFacebookSettings(): Promise<FacebookSettings | undefined> {
    return this.facebookSettings;
  }

  async updateFacebookSettings(settings: InsertFacebookSettings): Promise<FacebookSettings> {
    const id = this.facebookSettings?.id || randomUUID();
    this.facebookSettings = {
      ...settings,
      id,
      updatedAt: new Date(),
    };
    return this.facebookSettings;
  }

  async getChatStats(date: string): Promise<ChatStats | undefined> {
    return this.chatStats.get(date);
  }

  async updateChatStats(date: string, updates: Partial<InsertChatStats>): Promise<ChatStats> {
    const existing = this.chatStats.get(date);
    const stats: ChatStats = {
      id: existing?.id || randomUUID(),
      date,
      totalConversations: updates.totalConversations || existing?.totalConversations || "0",
      resolvedQueries: updates.resolvedQueries || existing?.resolvedQueries || "0",
      balanceInquiries: updates.balanceInquiries || existing?.balanceInquiries || "0",
      averageResponses: updates.averageResponses || existing?.averageResponses || "0",
    };
    this.chatStats.set(date, stats);
    return stats;
  }

  async addMessageToConversation(conversationId: string, message: Message): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;
    
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    messages.push(message);
    
    await this.updateConversation(conversationId, { messages });
    return true;
  }
}

export const storage = new MemStorage();
