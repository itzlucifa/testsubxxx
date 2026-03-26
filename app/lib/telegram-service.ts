/**
 * Telegram Channel Integration Service
 * Fetches messages from a Telegram channel and integrates them into the app's message system
 */

interface TelegramMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  read: boolean;
  createdAt?: Date;
}

class TelegramIntegrationService {
  private telegramBotToken: string | null = null;
  private telegramChannelId: string | null = null;
  private telegramChannelLink: string = 'https://t.me/+UdWq8IQitqVjODM1'; // Default to your channel
  private intervalId: NodeJS.Timeout | null = null;
  private pollingInterval = 30000; // 30 seconds
  
  constructor() {
    // Load Telegram bot token and channel ID from environment or config
    this.telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || null;
    this.telegramChannelId = import.meta.env.VITE_TELEGRAM_CHANNEL_ID || null;
  }
  
  /**
   * Initialize the Telegram integration
   */
  initialize() {
    if (!this.telegramBotToken || !this.telegramChannelId) {
      console.warn('Telegram integration not configured. Missing bot token or channel ID.');
      return false;
    }
    
    // Start polling for new messages
    this.startPolling();
    return true;
  }
  
  /**
   * Start polling for new messages from Telegram
   */
  startPolling() {
    if (!this.telegramBotToken || !this.telegramChannelId) {
      return;
    }
    
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Poll for new messages at the specified interval
    this.intervalId = setInterval(async () => {
      try {
        await this.fetchNewMessages();
      } catch (error) {
        console.error('Error fetching Telegram messages:', error);
      }
    }, this.pollingInterval);
  }
  
  /**
   * Stop polling for new messages
   */
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Fetch new messages from the Telegram channel
   */
  async fetchNewMessages(): Promise<TelegramMessage[]> {
    if (!this.telegramBotToken || !this.telegramChannelId) {
      return [];
    }
    
    try {
      // Get the latest message ID stored locally to fetch only new messages
      const lastMessageId = parseInt(localStorage.getItem('lastTelegramMessageId') || '0');
      
      // Construct the API URL to get updates
      const offset = lastMessageId > 0 ? lastMessageId + 1 : undefined;
      const apiUrl = `https://api.telegram.org/bot${this.telegramBotToken}/getUpdates?offset=${offset}&timeout=30`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (!data.ok) {
        console.error('Error fetching Telegram updates:', data);
        return [];
      }
      
      const newMessages: TelegramMessage[] = [];
      
      for (const update of data.result) {
        if (update.channel_post && update.channel_post.chat.id.toString() === this.telegramChannelId) {
          const post = update.channel_post;
          const message: TelegramMessage = {
            id: post.message_id,
            sender: 'Telegram Channel',
            message: post.text || post.caption || 'Media message',
            timestamp: new Date(post.date * 1000).toLocaleString(),
            read: false
          };
          
          newMessages.push(message);
          
          // Update the last message ID
          if (post.message_id > (lastMessageId || 0)) {
            localStorage.setItem('lastTelegramMessageId', post.message_id.toString());
          }
        }
      }
      
      return newMessages;
    } catch (error) {
      console.error('Error fetching Telegram messages:', error);
      return [];
    }
  }
  
  /**
   * Send a message to the Telegram channel
   */
  async sendMessageToChannel(message: string): Promise<boolean> {
    if (!this.telegramBotToken || !this.telegramChannelId) {
      console.error('Telegram bot token or channel ID not configured');
      return false;
    }
    
    try {
      const apiUrl = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.telegramChannelId,
          text: message,
          parse_mode: 'HTML'
        })
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        console.error('Error sending message to Telegram:', data);
        return false;
      }
      
      console.log('Message sent to Telegram channel successfully');
      return true;
    } catch (error) {
      console.error('Error sending message to Telegram:', error);
      return false;
    }
  }
  
  /**
   * Get Telegram messages that can be integrated into the app's message system
   */
  async getIntegratableMessages(): Promise<TelegramMessage[]> {
    if (!this.telegramBotToken || !this.telegramChannelId) {
      return [];
    }
    
    return await this.fetchNewMessages();
  }
  
  /**
   * Configure Telegram integration with bot token and channel ID
   */
  configure(botToken: string, channelId: string) {
    this.telegramBotToken = botToken;
    this.telegramChannelId = channelId;
    
    // Save to localStorage for persistence
    localStorage.setItem('telegramBotToken', botToken);
    localStorage.setItem('telegramChannelId', channelId);
    
    // Restart polling if needed
    this.startPolling();
  }
  
  /**
   * Check if Telegram integration is configured
   */
  isConfigured(): boolean {
    return !!this.telegramBotToken && !!this.telegramChannelId;
  }
  
  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      botTokenSet: !!this.telegramBotToken,
      channelIdSet: !!this.telegramChannelId,
      channelLink: this.telegramChannelLink,
      isConfigured: this.isConfigured()
    };
  }
  
  /**
   * Get the configured Telegram channel link
   */
  getChannelLink(): string {
    return this.telegramChannelLink;
  }
}

// Create a singleton instance
export const telegramService = new TelegramIntegrationService();

// Export the interface for use in other files
export type { TelegramMessage };