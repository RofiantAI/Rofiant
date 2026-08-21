export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  persona: string;
  personas: string[] | null;
  pinned: boolean;
  subtitle: string | null;
  description: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithLastMessage extends Conversation {
  messages: Pick<Message, "content" | "role">[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  persona: string | null;
  created_at: string;
}

export type ToolCallStatus = "running" | "completed" | "failed";

export interface ToolCall {
  id: string;
  conversation_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  result: string | null;
  status: ToolCallStatus;
  created_at: string;
}
