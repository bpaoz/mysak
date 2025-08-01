import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ChatInterface from "@/components/chat-interface";
import AdminPanel from "@/components/admin-panel";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Settings, Smartphone } from "lucide-react";

type Language = 'ar' | 'fr';

export default function ChatBot() {
  const [language, setLanguage] = useState<Language>('ar');
  const [showAdmin, setShowAdmin] = useState(false);
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const { data: facebookSettings } = useQuery({
    queryKey: ['/api/facebook-settings'],
  });

  const { data: todayStats } = useQuery({
    queryKey: ['/api/stats/today'],
  });

  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-mobilis-blue shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Smartphone className="text-mobilis-blue text-lg" />
              </div>
              <h1 className="text-white text-xl font-bold">
                {language === 'ar' ? 'موبليس شات بوت' : 'Mobilis ChatBot'}
              </h1>
            </div>
            
            <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              {/* Language Toggle */}
              <div className="bg-white/10 rounded-lg p-1 flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-3 py-1 rounded text-white text-sm font-medium ${
                    language === 'ar' ? 'bg-white/20' : 'text-white/70 hover:text-white'
                  }`}
                  onClick={() => setLanguage('ar')}
                >
                  عربي
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-3 py-1 rounded text-white text-sm font-medium ${
                    language === 'fr' ? 'bg-white/20' : 'text-white/70 hover:text-white'
                  }`}
                  onClick={() => setLanguage('fr')}
                >
                  Français
                </Button>
              </div>
              
              {/* Admin Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-mobilis-orange transition-colors"
                onClick={() => setShowAdmin(true)}
              >
                <Settings className="text-lg" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-8">
            <ChatInterface userId={userId} language={language} />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-4">
            <Sidebar 
              language={language} 
              userId={userId}
              facebookSettings={facebookSettings}
              todayStats={todayStats}
            />
          </div>
        </div>
      </div>

      {/* Admin Panel Modal */}
      {showAdmin && (
        <AdminPanel 
          language={language} 
          onClose={() => setShowAdmin(false)} 
        />
      )}
    </div>
  );
}
