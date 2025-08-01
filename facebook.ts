export interface FacebookWebhookEvent {
  object: string;
  entry: {
    id: string;
    time: number;
    messaging: {
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text: string;
      };
      postback?: {
        title: string;
        payload: string;
      };
    }[];
  }[];
}

export interface FacebookMessageRequest {
  recipient: { id: string };
  message: {
    text?: string;
    quick_replies?: {
      content_type: string;
      title: string;
      payload: string;
    }[];
  };
}

export class FacebookMessengerAPI {
  private pageAccessToken: string;

  constructor(pageAccessToken: string) {
    this.pageAccessToken = pageAccessToken;
  }

  async sendMessage(recipientId: string, messageText: string): Promise<boolean> {
    try {
      const messageData: FacebookMessageRequest = {
        recipient: { id: recipientId },
        message: { text: messageText }
      };

      const response = await fetch(`https://graph.facebook.com/v12.0/me/messages?access_token=${this.pageAccessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Facebook API Error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending Facebook message:', error);
      return false;
    }
  }

  async sendQuickReplies(recipientId: string, text: string, quickReplies: { title: string; payload: string }[]): Promise<boolean> {
    try {
      const messageData: FacebookMessageRequest = {
        recipient: { id: recipientId },
        message: {
          text,
          quick_replies: quickReplies.map(reply => ({
            content_type: 'text',
            title: reply.title,
            payload: reply.payload
          }))
        }
      };

      const response = await fetch(`https://graph.facebook.com/v12.0/me/messages?access_token=${this.pageAccessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending quick replies:', error);
      return false;
    }
  }

  static verifyWebhook(verifyToken: string, hubMode: string, hubVerifyToken: string, hubChallenge: string): string | null {
    if (hubMode === 'subscribe' && hubVerifyToken === verifyToken) {
      return hubChallenge;
    }
    return null;
  }
}
