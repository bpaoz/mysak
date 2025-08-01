import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Edit, Trash2, Settings } from "lucide-react";
import { SiFacebook } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BotResponse, FacebookSettings } from "@shared/schema";

interface AdminPanelProps {
  language: 'ar' | 'fr';
  onClose: () => void;
}

const translations = {
  ar: {
    adminPanel: "لوحة إدارة الشات بوت",
    responses: "الردود المبرمجة",
    intents: "تحليل النوايا",
    facebookSettings: "إعدادات فيسبوك",
    addNewResponse: "إضافة رد جديد",
    keywords: "الكلمات المفتاحية",
    serviceCategory: "فئة الخدمة",
    responseText: "نص الرد",
    add: "إضافة",
    currentResponses: "الردود الحالية",
    edit: "تحرير",
    delete: "حذف",
    pageAccessToken: "Page Access Token",
    verifyToken: "Verify Token",
    webhookUrl: "Webhook URL",
    updateSettings: "تحديث الإعدادات",
    balanceInquiry: "استعلام الرصيد",
    rechargeService: "خدمة الشحن",
    plansService: "خدمة الباقات",
    technicalSupport: "الدعم الفني",
    general: "عام",
    keywordsPlaceholder: "رصيد، balance، solde",
    responseArPlaceholder: "رصيدكم الحالي هو...",
    responseFrPlaceholder: "Votre solde actuel est...",
    success: "نجح العمل",
    error: "خطأ",
    responseAdded: "تم إضافة الرد بنجاح",
    responseUpdated: "تم تحديث الرد بنجاح",
    responseDeleted: "تم حذف الرد بنجاح",
    settingsUpdated: "تم تحديث الإعدادات بنجاح",
    fillAllFields: "يرجى ملء جميع الحقول"
  },
  fr: {
    adminPanel: "Panneau d'Administration du ChatBot",
    responses: "Réponses Programmées",
    intents: "Analyse des Intentions",
    facebookSettings: "Paramètres Facebook",
    addNewResponse: "Ajouter une Nouvelle Réponse",
    keywords: "Mots-clés",
    serviceCategory: "Catégorie de Service",
    responseText: "Texte de Réponse",
    add: "Ajouter",
    currentResponses: "Réponses Actuelles",
    edit: "Modifier",
    delete: "Supprimer",
    pageAccessToken: "Page Access Token",
    verifyToken: "Verify Token",
    webhookUrl: "URL Webhook",
    updateSettings: "Mettre à Jour les Paramètres",
    balanceInquiry: "Demande de Solde",
    rechargeService: "Service de Recharge",
    plansService: "Service des Forfaits",
    technicalSupport: "Support Technique",
    general: "Général",
    keywordsPlaceholder: "solde, balance, crédit",
    responseArPlaceholder: "رصيدكم الحالي هو...",
    responseFrPlaceholder: "Votre solde actuel est...",
    success: "Succès",
    error: "Erreur",
    responseAdded: "Réponse ajoutée avec succès",
    responseUpdated: "Réponse mise à jour avec succès",
    responseDeleted: "Réponse supprimée avec succès",
    settingsUpdated: "Paramètres mis à jour avec succès",
    fillAllFields: "Veuillez remplir tous les champs"
  }
};

export default function AdminPanel({ language, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("responses");
  const [editingResponse, setEditingResponse] = useState<BotResponse | null>(null);
  const [newResponse, setNewResponse] = useState({
    intent: "",
    keywords: "",
    responseAr: "",
    responseFr: "",
    category: "general"
  });
  const [facebookForm, setFacebookForm] = useState({
    pageAccessToken: "",
    verifyToken: "",
    webhookUrl: `${window.location.origin}/webhook/messenger`,
    isActive: false
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = translations[language];

  const { data: botResponses, isLoading: responsesLoading } = useQuery({
    queryKey: ['/api/bot-responses'],
  });

  const { data: facebookSettings } = useQuery({
    queryKey: ['/api/facebook-settings'],
    onSuccess: (data) => {
      if (data) {
        setFacebookForm({
          pageAccessToken: data.pageAccessToken || "",
          verifyToken: data.verifyToken || "",
          webhookUrl: data.webhookUrl || `${window.location.origin}/webhook/messenger`,
          isActive: data.isActive || false
        });
      }
    }
  });

  const addResponseMutation = useMutation({
    mutationFn: async (response: any) => {
      const apiResponse = await apiRequest('POST', '/api/bot-responses', {
        ...response,
        keywords: response.keywords.split(',').map((k: string) => k.trim()),
        isActive: true
      });
      return apiResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot-responses'] });
      setNewResponse({
        intent: "",
        keywords: "",
        responseAr: "",
        responseFr: "",
        category: "general"
      });
      toast({
        title: t.success,
        description: t.responseAdded
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.fillAllFields,
        variant: "destructive"
      });
    }
  });

  const updateResponseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const apiResponse = await apiRequest('PUT', `/api/bot-responses/${id}`, {
        ...updates,
        keywords: typeof updates.keywords === 'string' 
          ? updates.keywords.split(',').map((k: string) => k.trim())
          : updates.keywords
      });
      return apiResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot-responses'] });
      setEditingResponse(null);
      toast({
        title: t.success,
        description: t.responseUpdated
      });
    }
  });

  const deleteResponseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/bot-responses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot-responses'] });
      toast({
        title: t.success,
        description: t.responseDeleted
      });
    }
  });

  const updateFacebookSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const apiResponse = await apiRequest('POST', '/api/facebook-settings', settings);
      return apiResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facebook-settings'] });
      toast({
        title: t.success,
        description: t.settingsUpdated
      });
    }
  });

  const handleAddResponse = () => {
    if (!newResponse.intent || !newResponse.keywords || !newResponse.responseAr || !newResponse.responseFr) {
      toast({
        title: t.error,
        description: t.fillAllFields,
        variant: "destructive"
      });
      return;
    }
    addResponseMutation.mutate(newResponse);
  };

  const handleUpdateResponse = () => {
    if (!editingResponse) return;
    updateResponseMutation.mutate({
      id: editingResponse.id,
      updates: editingResponse
    });
  };

  const handleDeleteResponse = (id: string) => {
    deleteResponseMutation.mutate(id);
  };

  const handleUpdateFacebookSettings = () => {
    updateFacebookSettingsMutation.mutate(facebookForm);
  };

  const categoryOptions = [
    { value: "balance", label: t.balanceInquiry },
    { value: "recharge", label: t.rechargeService },
    { value: "plans", label: t.plansService },
    { value: "support", label: t.technicalSupport },
    { value: "general", label: t.general }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className={`flex items-center ${language === 'ar' ? 'space-x-reverse' : ''} space-x-3`}>
              <Settings className="text-mobilis-orange" />
              <span>{t.adminPanel}</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="responses">{t.responses}</TabsTrigger>
            <TabsTrigger value="intents">{t.intents}</TabsTrigger>
            <TabsTrigger value="facebook">{t.facebookSettings}</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] mt-4">
            <TabsContent value="responses" className="space-y-6">
              {/* Add New Response */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.addNewResponse}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t.keywords}</Label>
                      <Input
                        placeholder={t.keywordsPlaceholder}
                        value={newResponse.keywords}
                        onChange={(e) => setNewResponse({...newResponse, keywords: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>{t.serviceCategory}</Label>
                      <Select value={newResponse.category} onValueChange={(value) => setNewResponse({...newResponse, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Intent ID</Label>
                    <Input
                      placeholder="balance_inquiry"
                      value={newResponse.intent}
                      onChange={(e) => setNewResponse({...newResponse, intent: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>{t.responseText} (Arabic)</Label>
                    <Textarea
                      placeholder={t.responseArPlaceholder}
                      value={newResponse.responseAr}
                      onChange={(e) => setNewResponse({...newResponse, responseAr: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>{t.responseText} (French)</Label>
                    <Textarea
                      placeholder={t.responseFrPlaceholder}
                      value={newResponse.responseFr}
                      onChange={(e) => setNewResponse({...newResponse, responseFr: e.target.value})}
                    />
                  </div>
                  <Button 
                    onClick={handleAddResponse}
                    disabled={addResponseMutation.isPending}
                    className="bg-mobilis-blue hover:bg-mobilis-dark"
                  >
                    <Plus className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                    {t.add}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Responses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.currentResponses}</CardTitle>
                </CardHeader>
                <CardContent>
                  {responsesLoading ? (
                    <div>Loading...</div>
                  ) : (
                    <div className="space-y-3">
                      {botResponses?.map((response: BotResponse) => (
                        <div key={response.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          {editingResponse?.id === response.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  value={Array.isArray(editingResponse.keywords) ? editingResponse.keywords.join(', ') : editingResponse.keywords}
                                  onChange={(e) => setEditingResponse({...editingResponse, keywords: e.target.value})}
                                />
                                <Select 
                                  value={editingResponse.category} 
                                  onValueChange={(value) => setEditingResponse({...editingResponse, category: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categoryOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Textarea
                                value={editingResponse.responseAr}
                                onChange={(e) => setEditingResponse({...editingResponse, responseAr: e.target.value})}
                              />
                              <Textarea
                                value={editingResponse.responseFr}
                                onChange={(e) => setEditingResponse({...editingResponse, responseFr: e.target.value})}
                              />
                              <div className={`flex space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                                <Button size="sm" onClick={handleUpdateResponse} disabled={updateResponseMutation.isPending}>
                                  {t.success}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingResponse(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className={`flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''} mb-2`}>
                                  <Badge className="bg-mobilis-blue text-white">
                                    {categoryOptions.find(opt => opt.value === response.category)?.label || response.category}
                                  </Badge>
                                  <span className="text-gray-500 text-sm">
                                    {Array.isArray(response.keywords) ? response.keywords.join(', ') : response.keywords}
                                  </span>
                                </div>
                                <p className="text-gray-700 mb-1">{language === 'ar' ? response.responseAr : response.responseFr}</p>
                              </div>
                              <div className={`flex space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setEditingResponse(response)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDeleteResponse(response.id)}
                                  disabled={deleteResponseMutation.isPending}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="facebook" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center ${language === 'ar' ? 'space-x-reverse' : ''} space-x-2`}>
                    <SiFacebook className="text-blue-600" />
                    <span>{t.facebookSettings}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t.pageAccessToken}</Label>
                    <Input
                      type="password"
                      placeholder="EAAxxxxxxxxxx..."
                      value={facebookForm.pageAccessToken}
                      onChange={(e) => setFacebookForm({...facebookForm, pageAccessToken: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>{t.verifyToken}</Label>
                    <Input
                      placeholder="your_verify_token"
                      value={facebookForm.verifyToken}
                      onChange={(e) => setFacebookForm({...facebookForm, verifyToken: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>{t.webhookUrl}</Label>
                    <Input
                      value={facebookForm.webhookUrl}
                      onChange={(e) => setFacebookForm({...facebookForm, webhookUrl: e.target.value})}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                  <Button 
                    onClick={handleUpdateFacebookSettings}
                    disabled={updateFacebookSettingsMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <SiFacebook className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                    {t.updateSettings}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="intents">
              <Card>
                <CardHeader>
                  <CardTitle>{t.intents}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {language === 'ar' 
                      ? 'يتم تحليل النوايا تلقائياً بناءً على الكلمات المفتاحية المحددة في الردود المبرمجة.'
                      : 'L\'analyse des intentions est effectuée automatiquement en fonction des mots-clés définis dans les réponses programmées.'
                    }
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
