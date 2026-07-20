export type StudyMaterial = {
  id: string;
  type: 'PDF' | 'Note' | 'CreatePDF';
  class: string;
  subject: string;
  title: string;
  content?: string; // For Notes
  fileUrl?: string; // For PDFs
  fileSize?: string;
  uploadDate: number;
};

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  rollNumber?: string;
  studentClass?: string;
  address?: string;
  fatherName?: string;
  createdAt: number;
  bookmarks?: string[];
  completedMaterials?: string[];
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  fileUrl?: string;
  messageType: 'text' | 'voice' | 'image' | 'file';
  timestamp: number;
};

export type Notice = {
  id: string;
  title: string;
  content: string;
  timestamp: number;
};

export type PersonalNote = {
  id: string;
  userId: string;
  class: string;
  subject: string;
  title: string;
  content: string;
  timestamp: number;
};

export type RecentView = {
  id: string;
  title: string;
  type: 'PDF' | 'Note' | 'CreatePDF';
  timestamp: number;
  url?: string;
};

export type VideoLecture = {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  class: string;
  subject: string;
  uploadDate: number;
};
