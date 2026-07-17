export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified?: boolean;
  bio?: string;
  followers?: number;
  following?: number;
  posts?: number;
  online?: boolean;
}

export interface Post {
  id: string;
  author: User;
  image: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  time: string;
  location?: string;
}

export interface Story {
  id: string;
  user: User;
  image: string;
  seen?: boolean;
}

export interface Notification {
  id: string;
  user: User;
  type: "like" | "follow" | "comment" | "mention";
  text: string;
  time: string;
  unread: boolean;
  thumb?: string;
}

export interface Conversation {
  id: string;
  user: User;
  preview: string;
  time: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}
