export interface Notification {
    id?: string;
    from: string;
    message: string;
    timestamp: any;
    read: boolean;
    chatId?: string;
    channelId?: string;
    isFromChannel?: boolean;
  }
 