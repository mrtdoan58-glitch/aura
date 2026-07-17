import type { User, Post, Story, Notification, Conversation, Message } from "@/types";

const NAMES = [
  "Elif Yıldız", "Can Demir", "Zeynep Ak", "Mert Kaya", "Selin Öz",
  "Ada Çelik", "Kerem Bulut", "Nil Arda", "Ege Tan", "Deniz Su",
];
const USERNAMES = [
  "elifyildiz", "candemir", "zeynepak", "mertkaya", "selinoz",
  "adacelik", "kerembulut", "nilarda", "egetan", "denizsu",
];
const CAPTIONS = [
  "Sabah ışığında sessiz bir köşe. Bazen en iyi kompozisyon hiçbir şey eklememektir.",
  "Yeni seri üzerinde çalışıyorum — minimalizm ve boşluğun gücü.",
  "Bugünün paleti: kum, kil ve gün batımı.",
  "Detaylarda kaybolmak. Doku her şeydir.",
  "Şehrin ritmi ile doğanın sessizliği arasında bir yerde.",
];
const TAGSETS = [
  ["minimal", "tasarım", "ışık"],
  ["mimari", "boşluk", "form"],
  ["fotoğraf", "analog", "doku"],
  ["sanat", "studio", "premium"],
];
const FEED_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80",
  "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&q=80",
  "https://images.unsplash.com/photo-1507908708918-778587c9e563?w=800&q=80",
  "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=800&q=80",
];
export const EXPLORE_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=500&q=80",
  "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=500&q=80",
  "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=500&q=80",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=500&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&q=80",
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&q=80",
];
const avatar = (n: number) => `https://i.pravatar.cc/200?img=${n}`;

export function makeUser(i: number): User {
  return {
    id: `u${i}`,
    name: NAMES[i % NAMES.length],
    username: USERNAMES[i % USERNAMES.length],
    avatar: avatar((i % 60) + 10),
    verified: i % 2 === 0,
    online: i % 3 === 0,
  };
}

export const currentUser: User = {
  id: "me",
  name: "Deniz Aksoy",
  username: "denizaksoy",
  avatar: avatar(68),
  verified: true,
  bio: "Minimal tasarım & fotoğraf üzerine çalışıyorum. Işık, boşluk ve denge peşinde.",
  followers: 32400,
  following: 861,
  posts: 248,
};

export const stories: Story[] = Array.from({ length: 8 }, (_, i) => ({
  id: `s${i}`,
  user: makeUser(i),
  image: FEED_IMAGES[i % FEED_IMAGES.length],
  seen: i > 4,
}));

export const posts: Post[] = Array.from({ length: 8 }, (_, i) => ({
  id: `p${i}`,
  author: makeUser(i),
  image: FEED_IMAGES[i % FEED_IMAGES.length],
  caption: CAPTIONS[i % CAPTIONS.length],
  tags: TAGSETS[i % TAGSETS.length],
  likes: 1200 + i * 337,
  comments: 18 + i,
  time: ["2 dk", "18 dk", "1 sa", "3 sa", "dün"][i % 5],
  location: ["İstanbul", "Berlin", "Tokyo", "Lizbon", "Oslo"][i % 5],
}));

export const notifications: Notification[] = [
  { id: "n1", user: makeUser(1), type: "like", text: "gönderini beğendi.", time: "2dk", unread: true, thumb: FEED_IMAGES[1] },
  { id: "n2", user: makeUser(3), type: "follow", text: "seni takip etmeye başladı.", time: "14dk", unread: true },
  { id: "n3", user: makeUser(5), type: "comment", text: 'yorum yaptı: "Harika bir kompozisyon!"', time: "36dk", unread: true, thumb: FEED_IMAGES[2] },
  { id: "n4", user: makeUser(7), type: "mention", text: "bir gönderide senden bahsetti.", time: "2g", unread: false, thumb: FEED_IMAGES[3] },
  { id: "n5", user: makeUser(9), type: "like", text: "ve 24 kişi hikayeni beğendi.", time: "3g", unread: false, thumb: FEED_IMAGES[0] },
  { id: "n6", user: makeUser(2), type: "follow", text: "seni takip etmeye başladı.", time: "4g", unread: false },
];

export const conversations: Conversation[] = [
  { id: "c1", user: makeUser(0), preview: "Tasarımı çok beğendim!", time: "2dk", unreadCount: 2 },
  { id: "c2", user: makeUser(1), preview: "Yarın toplantı saat kaçtaydı?", time: "18dk", unreadCount: 1 },
  { id: "c3", user: makeUser(2), preview: "Fotoğrafları gönderdim", time: "1sa", unreadCount: 0 },
  { id: "c4", user: makeUser(3), preview: "Sesli mesaj · 0:24", time: "3sa", unreadCount: 0 },
  { id: "c5", user: makeUser(4), preview: "Görüşürüz!", time: "dün", unreadCount: 0 },
  { id: "c6", user: makeUser(6), preview: "Şu paleti bir dene derim", time: "2g", unreadCount: 0 },
];

export const messagesById: Record<string, Message[]> = {
  c1: [
    { id: "m1", from: "them", text: "Selam! Yeni tasarımı gördün mü?", time: "09:12" },
    { id: "m2", from: "me", text: "Evet, harika olmuş", time: "09:13" },
    { id: "m3", from: "them", text: "Renk paletini çok sevdim. Sen mi seçtin?", time: "09:13" },
    { id: "m4", from: "me", text: "Aynen, gün batımından ilham aldım", time: "09:14" },
    { id: "m5", from: "them", text: "Tasarımı çok beğendim!", time: "09:15" },
  ],
};

export function getMessages(id: string): Message[] {
  return (
    messagesById[id] ?? [
      { id: "d1", from: "them", text: "Selam!", time: "09:00" },
      { id: "d2", from: "me", text: "Merhaba, nasılsın?", time: "09:01" },
      { id: "d3", from: "them", text: "İyiyim, teşekkürler", time: "09:02" },
    ]
  );
}

export const suggestions: User[] = Array.from({ length: 4 }, (_, i) => makeUser(i + 3));
export const profileGrid = [...EXPLORE_IMAGES, ...EXPLORE_IMAGES.slice(0, 5)];
export const trends = [
  { tag: "minimaltasarım", count: "24B gönderi" },
  { tag: "gündoğumu", count: "18B gönderi" },
  { tag: "analogfotoğraf", count: "12B gönderi" },
  { tag: "mimaridetay", count: "9B gönderi" },
  { tag: "studiolight", count: "6B gönderi" },
];
