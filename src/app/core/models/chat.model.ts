export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  conversationId: string;
  reply: string;
  model: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  content: string;
}
