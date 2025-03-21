export interface ChatMessage {
    id?: string; 
    senderId: string;
    receiverId: string;
    message: string;
    timestamp: number;
    replyId?: string;
  }