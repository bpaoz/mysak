import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User, Send, Mic, Wallet, CreditCard, List, Headphones } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message } from "@shared/schema";

interface ChatInterfaceProps {
  userId: string;
  language: 'ar' | 'fr';
}

const translations = {
  ar: {
    welcome: "مرحباً بكم في خدمة عملاء موبليس! كيف يمكنني مساعدتكم اليوم؟",
    services: "يمكنكم اختيار إحدى الخدمات التالية:",
    balance: "الرصيد",
    recharge: "الشحن", 
    plans: "الباقات",
    support: "الدعم الفني",
    placeholder: "اكتب رسالتك هنا...",
    assistant: "مساعد موبليس الذكي",
    available: "متاح على مدار الساعة لخدمتكم",
    now: "الآن",
    processing: "جاري المعالجة..."
  },
  fr: {
    welcome: "Bienvenue chez Mobilis! Comment puis-je vous aider aujourd'hui?",
    services: "Vous pouvez choisir un de ces services:",
    balance: "Solde",
    recharge: "Recharge",
    plans: "Forfaits", 
    support: "Support",
    placeholder: "Tapez votre message ici...",
    assistant: "Assistant Intelligent Mobilis",
    available: "Disponible 24h/24 pour vous servir",
    now: "Maintenant",
    processing: "En cours de traitement..."
  }
};

export default function ChatInterface({ userId, language }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = translations[language];

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['/api/conversations', userId],
    staleTime: 0,
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/conversations', {
        userId,
        platform: 'web',
        messages: [],
        isActive: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', userId] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, text, sender }: { conversationId: string, text: string, sender: 'user' | 'bot' }) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        text,
        sender,
        language
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', userId] });
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      setIsTyping(false);
    }
  });

  // Initialize conversation if it doesn't exist
  useEffect(() => {
    if (!isLoading && !conversation) {
      createConversationMutation.mutate();
    }
  }, [conversation, isLoading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversation) return;

    const text = messageText.trim();
    setMessageText("");
    setIsTyping(true);

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: conversation.id,
        text,
        sender: 'user'
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleServiceClick = async (service: string) => {
    if (!conversation) return;

    const serviceMessages = {
      balance: language === 'ar' ? 'أريد معرفة رصيدي' : 'Je veux connaître mon solde',
      recharge: language === 'ar' ? 'كيف يمكنني شحن رصيدي؟' : 'Comment puis-je recharger mon crédit?',
      plans: language === 'ar' ? 'أريد معرفة الباقات المتاحة' : 'Je veux connaître les forfaits disponibles',
      support: language === 'ar' ? 'أحتاج للدعم الفني' : 'J\'ai besoin d\'assistance technique'
    };

    const text = serviceMessages[service as keyof typeof serviceMessages];
    if (text) {
      setIsTyping(true);
      try {
        await sendMessageMutation.mutateAsync({
          conversationId: conversation.id,
          text,
          sender: 'user'
        });
      } catch (error) {
        console.error('Error sending service message:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const messages: Message[] = Array.isArray(conversation?.messages) ? conversation.messages : [];

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-mobilis-blue to-mobilis-dark p-4 text-white">
        <div className={`flex items-center space-x-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="text-lg" />
          </div>
          <div>
            <h3 className="font-semibold">{t.assistant}</h3>
            <p className="text-sm opacity-90">{t.available}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages">
        {messages.length === 0 && (
          <>
            {/* Bot Welcome Message */}
            <div className={`flex items-start space-x-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
              <div className="w-8 h-8 bg-mobilis-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white text-sm" />
              </div>
              <div className="bg-mobilis-light rounded-lg rounded-tr-none p-3 max-w-xs lg:max-w-md">
                <p className="text-gray-800">{t.welcome}</p>
                <span className="text-xs text-gray-500 mt-1 block">{t.now}</span>
              </div>
            </div>

            {/* Service Options */}
            <div className={`flex items-start space-x-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
              <div className="w-8 h-8 bg-mobilis-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white text-sm" />
              </div>
              <div className="space-y-2">
                <div className="bg-mobilis-light rounded-lg rounded-tr-none p-3 max-w-xs lg:max-w-md">
                  <p className="text-gray-800">{t.services}</p>
                </div>
                
                {/* Service Buttons */}
                <div className="grid grid-cols-2 gap-2 max-w-xs lg:max-w-md">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-mobilis-blue text-mobilis-blue hover:bg-mobilis-blue hover:text-white transition-colors text-sm font-medium"
                    onClick={() => handleServiceClick('balance')}
                    disabled={sendMessageMutation.isPending}
                  >
                    <Wallet className={`text-xs ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                    {t.balance}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-mobilis-blue text-mobilis-blue hover:bg-mobilis-blue hover:text-white transition-colors text-sm font-medium"
                    onClick={() => handleServiceClick('recharge')}
                    disabled={sendMessageMutation.isPending}
                  >
                    <CreditCard className={`text-xs ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                    {t.recharge}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-mobilis-blue text-mobilis-blue hover:bg-mobilis-blue hover:text-white transition-colors text-sm font-medium"
                    onClick={() => handleServiceClick('plans')}
                    disabled={sendMessageMutation.isPending}
                  >
                    <List className={`text-xs ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                    {t.plans}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-mobilis-blue text-mobilis-blue hover:bg-mobilis-blue hover:text-white transition-colors text-sm font-medium"
                    onClick={() => handleServiceClick('support')}
                    disabled={sendMessageMutation.isPending}
                  >
                    <Headphones className={`text-xs ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                    {t.support}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Conversation Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.sender === 'user' 
                ? `justify-end ${language === 'ar' ? 'space-x-reverse' : ''}` 
                : language === 'ar' ? 'space-x-reverse' : ''
            }`}
          >
            {message.sender === 'user' ? (
              <>
                <div className="bg-mobilis-blue rounded-lg rounded-tl-none p-3 max-w-xs lg:max-w-md">
                  <p className="text-white">{message.text}</p>
                  <span className="text-xs text-blue-200 mt-1 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-gray-600 text-sm" />
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-mobilis-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white text-sm" />
                </div>
                <div className="bg-mobilis-light rounded-lg rounded-tr-none p-3 max-w-xs lg:max-w-md">
                  <p className="text-gray-800">{message.text}</p>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className={`flex items-start space-x-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
            <div className="w-8 h-8 bg-mobilis-blue rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-white text-sm" />
            </div>
            <div className="bg-mobilis-light rounded-lg rounded-tr-none p-3 max-w-xs lg:max-w-md">
              <p className="text-gray-800">{t.processing}</p>
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-mobilis-blue rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-mobilis-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-mobilis-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Chat Input */}
      <div className="border-t p-4">
        <div className={`flex space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={t.placeholder}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending || !conversation}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              className={`absolute ${language === 'ar' ? 'right-2' : 'left-2'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-mobilis-blue`}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending || !conversation}
            className="bg-mobilis-blue text-white hover:bg-mobilis-dark transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
