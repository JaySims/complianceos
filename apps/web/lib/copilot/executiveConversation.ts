export type ConversationRole =
  | "user"
  | "assistant";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  message: string;
  createdAt: Date;
};

export function createMessage(
  role: ConversationRole,
  message: string
): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    role,
    message,
    createdAt: new Date(),
  };
}
