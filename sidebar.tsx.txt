import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Wallet, 
  Plus, 
  List, 
  MessageCircle, 
  Settings,
  BarChart3,
  CheckCircle,
  HelpCircle,
  Users
} from "lucide-react";
import { SiFacebook } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FacebookSettings, ChatStats } from "@shared/schema";

interface SidebarProps {
  language: 'ar' | 'fr';
  userId: string;
  facebookSettings?: FacebookSettings;
  todayStats?: ChatStats;
}

const translations = {
  ar: {
    quickServices: "الخدمات السريعة",
    checkBalance: "فحص الرصيد",
    recharge: "شحن الرصيد", 
    viewPlans: "عرض الباقات",
    facebookIntegration: "ربط فيسبوك مسنجر",
    connectionStatus: "حالة الاتصال",
    connected: "متصل",
    disconnected: "غير متصل",
    webhookUrl: "Webhook URL",
    integrationSettings: "إعدادات التكامل",
    todayStats: "إحصائيات اليوم",
    conversations: "محادثة",
    resolutionRate: "معدل الحل",
    balanceInquiries: "استفسار رصيد",
    avgResponses: "متوسط الردود"
  },
  fr: {
    quickServices: "Services Rapides",
    checkBalance: "Vérifier le Solde",
    recharge: "Recharger le Crédit",
    viewPlans: "Voir les Forfaits",
    facebookIntegration: "Intégration Facebook Messenger",
    connectionStatus: "Statut de Connexion",
    connected: "Connecté",
    disconnected: "Déconnecté",
    webhookUrl: "URL Webhook",
    integrationSettings: "Paramètres d'Intégration",
    todayStats: "Statistiques d'Aujourd'hui",
    conversations: "Conversations",
    resolutionRate: "Taux de Résolution",
    balanceInquiries: "Demandes de Solde",
    avgResponses: "Réponses Moyennes"
  }
};

export default function Sidebar({ language, userId, facebookSettings, todayStats }: SidebarProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = translations[language];

  const sendServiceMessageMutation = useMutation({
    mutationFn: async (serviceText: string) => {
      // First get or create conversation
      let conversation;
      try {
        const convResponse = await fetch(`/api/conversations/${userId}`);
        if (convResponse.ok) {
          conversation = await convResponse.json();
        }
      } catch (error) {
        // Conversation doesn't exist, create it
        const createResponse = await apiRequest('POST', '/api/conversations', {
          userId,
          platform: 'web',
          messages: [],
          isActive: true
        });
        conversation = await createResponse.json();
      }

      if (conversation) {
        const response = await apiRequest('POST', `/api/conversations/${conversation.id}/messages`, {
          text: serviceText,
          sender: 'user',
          language
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', userId] });
      toast({
        title: language === 'ar' ? "تم الإرسال" : "Envoyé",
        description: language === 'ar' ? "تم إرسال طلبكم بنجاح" : "Votre demande a été envoyée avec succès"
      });
    },
    onError: () => {
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "فشل في إرسال الطلب" : "Échec de l'envoi de la demande",
        variant: "destructive"
      });
    }
  });

  const handleQuickService = (service: 'balance' | 'recharge' | 'plans') => {
    const serviceMessages = {
      balance: language === 'ar' ? 'أريد معرفة رصيدي' : 'Je veux connaître mon solde',
      recharge: language === 'ar' ? 'كيف يمكنني شحن رصيدي؟' : 'Comment puis-je recharger mon crédit?',
      plans: language === 'ar' ? 'أريد معرفة الباقات المتاحة' : 'Je veux connaître les forfaits disponibles'
    };

    sendServiceMessageMutation.mutate(serviceMessages[service]);
  };

  const isConnected = facebookSettings?.isActive && facebookSettings?.pageAccessToken;
  const webhookUrl = facebookSettings?.webhookUrl || `${window.location.origin}/webhook/messenger`;

  return (
    <div className="space-y-6">
      {/* Quick Services */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center ${language === 'ar' ? 'space-x-reverse' : ''} space-x-2`}>
            <Zap className="text-mobilis-orange" />
            <span>{t.quickServices}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => handleQuickService('balance')}
            disabled={sendServiceMessageMutation.isPending}
            className="w-full bg-gradient-to-r from-mobilis-blue to-mobilis-dark text-white hover:shadow-lg transition-all"
          >
            <Wallet className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.checkBalance}
          </Button>
          <Button
            onClick={() => handleQuickService('recharge')}
            disabled={sendServiceMessageMutation.isPending}
            className="w-full bg-gradient-to-r from-mobilis-orange to-orange-600 text-white hover:shadow-lg transition-all"
          >
            <Plus className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.recharge}
          </Button>
          <Button
            onClick={() => handleQuickService('plans')}
            disabled={sendServiceMessageMutation.isPending}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-all"
          >
            <List className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.viewPlans}
          </Button>
        </CardContent>
      </Card>

      {/* Facebook Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center ${language === 'ar' ? 'space-x-reverse' : ''} space-x-2`}>
            <SiFacebook className="text-blue-600" />
            <span>{t.facebookIntegration}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isConnected ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <span className="text-sm text-gray-600">{t.connectionStatus}</span>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              } ${language === 'ar' ? 'ml-2' : 'mr-2'}`}></div>
              <span className={`font-medium text-sm ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {isConnected ? t.connected : t.disconnected}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>{t.webhookUrl}:</p>
            <code className="bg-gray-100 p-2 rounded mt-1 block text-xs break-all">
              {webhookUrl}
            </code>
          </div>
          <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm">
            <Settings className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {t.integrationSettings}
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center ${language === 'ar' ? 'space-x-reverse' : ''} space-x-2`}>
            <BarChart3 className="text-mobilis-orange" />
            <span>{t.todayStats}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-mobilis-blue">
                {todayStats?.totalConversations || "0"}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <MessageCircle className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {t.conversations}
              </div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-mobilis-orange">
                {todayStats?.resolvedQueries ? 
                  `${Math.round((parseInt(todayStats.resolvedQueries) / parseInt(todayStats.totalConversations || "1")) * 100)}%` 
                  : "0%"}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <CheckCircle className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {t.resolutionRate}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {todayStats?.balanceInquiries || "0"}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <Wallet className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {t.balanceInquiries}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {todayStats?.averageResponses || "0"}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center">
                <Users className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {t.avgResponses}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
