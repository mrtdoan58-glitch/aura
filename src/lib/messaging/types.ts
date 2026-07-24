/** Messaging istemci DTO'ları — API JSON'unda tarihler ISO string olarak gelir. */
export interface UserInfoDTO {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  otherUser: UserInfoDTO;
  lastMessageText: string | null;
  lastMessageAt: string;
  lastMessageMine: boolean;
  unreadCount: number;
}

export interface ConversationListDTO {
  conversations: ConversationDTO[];
}

export interface ThreadDTO {
  id: string;
  otherUser: UserInfoDTO;
  messages: MessageDTO[];
  nextCursor: string | null;
}
