
export interface MemoryItem {
  id: string;
  type: 'text' | 'image' | 'pdf';
  name: string;
  content: string; // Base64 or raw text
  summary: string; // AI generated understanding
  timestamp: number;
}

export interface AgentSettings {
  role: string;
  tone: string;
  language: string;
}

export interface ApiKeyEntry {
  id: string;
  key: string;
  label: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  attachment?: {
    type: 'image' | 'text';
    content: string;
  };
  timestamp: number;
}

export type ViewState = 'knowledge' | 'chat' | 'settings';
