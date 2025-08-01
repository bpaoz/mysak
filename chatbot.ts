import type { ServiceIntent } from "@shared/schema";

export interface ChatBotService {
  analyzeIntent(message: string): ServiceIntent;
  generateResponse(intent: ServiceIntent, language: 'ar' | 'fr'): string;
}

export class MobilisChatBot implements ChatBotService {
  private predefinedIntents = {
    balance: {
      keywords: ['رصيد', 'balance', 'solde', 'credit', 'استعلام'],
      category: 'balance' as const
    },
    recharge: {
      keywords: ['شحن', 'recharge', 'rechargement', 'credit', 'top-up'],
      category: 'recharge' as const
    },
    plans: {
      keywords: ['باقة', 'باقات', 'forfait', 'plans', 'abonnement', 'subscription'],
      category: 'plans' as const
    },
    support: {
      keywords: ['مساعدة', 'دعم', 'aide', 'support', 'problème', 'مشكلة', 'help'],
      category: 'support' as const
    },
    greeting: {
      keywords: ['مرحبا', 'أهلا', 'السلام', 'bonjour', 'salut', 'hello', 'hi'],
      category: 'general' as const
    }
  };

  analyzeIntent(message: string): ServiceIntent {
    const normalizedMessage = message.toLowerCase().trim();
    
    let bestMatch: ServiceIntent = {
      intent: 'unknown',
      confidence: 0,
      category: 'general'
    };

    for (const [intentName, intentData] of Object.entries(this.predefinedIntents)) {
      for (const keyword of intentData.keywords) {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          const confidence = keyword.length / message.length;
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              intent: intentName,
              confidence,
              category: intentData.category
            };
          }
        }
      }
    }

    return bestMatch;
  }

  generateResponse(intent: ServiceIntent, language: 'ar' | 'fr'): string {
    const responses = {
      ar: {
        balance: "يمكنكم الاستعلام عن رصيدكم عبر الاتصال بـ *555# أو عبر تطبيق موبليس",
        recharge: "يمكنكم شحن رصيدكم عبر بطاقات الشحن أو عبر التطبيق المصرفي أو نقاط البيع المعتمدة",
        plans: "لدينا باقات متنوعة للمكالمات والإنترنت. اتصل بـ 600 للمزيد من التفاصيل أو زوروا أقرب وكالة موبليس",
        support: "فريق الدعم الفني متاح على 600 من 8:00 إلى 20:00، أو يمكنكم زيارة أقرب وكالة موبليس",
        greeting: "مرحباً بكم في خدمة عملاء موبليس! كيف يمكنني مساعدتكم اليوم؟",
        unknown: "عذراً، لم أفهم استفساركم. يمكنكم التواصل مع خدمة العملاء على 600 أو زيارة أقرب وكالة موبليس"
      },
      fr: {
        balance: "Vous pouvez consulter votre solde en composant *555# ou via l'application Mobilis",
        recharge: "Vous pouvez recharger via les cartes de recharge, l'application bancaire ou les points de vente agréés",
        plans: "Nous avons diverses offres d'appels et internet. Appelez le 600 pour plus de détails ou visitez une agence Mobilis",
        support: "Le support technique est disponible au 600 de 8h00 à 20h00, ou visitez l'agence Mobilis la plus proche",
        greeting: "Bienvenue chez Mobilis! Comment puis-je vous aider aujourd'hui?",
        unknown: "Désolé, je n'ai pas compris votre demande. Vous pouvez contacter le service client au 600 ou visiter une agence Mobilis"
      }
    };

    if (intent.confidence < 0.1) {
      return responses[language].unknown;
    }

    return responses[language][intent.intent as keyof typeof responses[typeof language]] || responses[language].unknown;
  }

  generateServiceQuickReplies(language: 'ar' | 'fr') {
    if (language === 'ar') {
      return [
        { title: "الرصيد", payload: "balance" },
        { title: "الشحن", payload: "recharge" },
        { title: "الباقات", payload: "plans" },
        { title: "الدعم", payload: "support" }
      ];
    } else {
      return [
        { title: "Solde", payload: "balance" },
        { title: "Recharge", payload: "recharge" },
        { title: "Forfaits", payload: "plans" },
        { title: "Support", payload: "support" }
      ];
    }
  }
}

export const mobilisBot = new MobilisChatBot();
