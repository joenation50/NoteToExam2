export type Role = "student" | "lecturer";

export type StudentPlan = "free" | "starter" | "duo" | "scholar" | "king";
export type LecturerPlan = "free" | "pro" | "elite";

export type Currency = "NGN" | "USD";

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string; // <-- ADDED FOR SEARCH
  matric: string;
  passwordHash: string;
  role: Role;
  studentPlan: StudentPlan;
  lecturerPlan: LecturerPlan;
  credits: number;
  chatsUsed: number;
  chatCap: number;
  devicesAllowed: number;
  activeDeviceId: string | null;
  sessionToken: string | null;
  banned: boolean;
  createdAt: number;
  referralCode: string;
  referredBy: string | null;
  googleLinked: boolean;
  streak: number;
  lastStudyDay: string | null;
  studySeconds: Record<string, number>;
  knowledgePoints: number;
  weakTopics: Record<string, number>;
  generations: { t: number }[];
  lecturerCredits: number;
  lecturerNaira: number;
  school: string;
  courseFocus: string;
  learningStage: "primary" | "secondary" | "university";
  lecturerVerify: string;
  avatar: string;
  age: string;
  classLevel: string;
  department: string;
}

export interface NoteDoc {
  id: string;
  ownerId: string;
  title: string;
  pages: number;
  charCount: number;
  text: string;
  summary: string;
  createdAt: number;
  sourceKind: "pdf" | "image";
  fileName: string;
}

export type QuestionKind = "direct" | "rephrased" | "connection";
export type QuestionFormat = "mcq" | "theory";

export interface Question {
  id: string;
  kind: QuestionKind;
  format: QuestionFormat;
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
  page: number;
  topic: string;
}

export interface QuestionSet {
  id: string;
  ownerId: string;
  noteId: string;
  title: string;
  createdAt: number;
  questions: Question[];
  lastScore: number | null;
  attempts: number;
  durationSec?: number;
  kind?: "note" | "curriculum";
}

export interface CbtAttempt {
  id: string;
  setId: string;
  ownerId: string;
  score: number;
  total: number;
  startedAt: number;
  finishedAt: number;
  answers: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "tutor";
  text: string;
  citations: { page: number | null; external: boolean }[];
  createdAt: number;
  eli5: boolean;
}

export interface TutorThread {
  id: string;
  ownerId: string;
  noteId: string | null;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface MarketItem {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  tag: "Past Questions" | "Summarized Notes" | "Likely Questions" | "Assignment Help" | "Video Lectures";
  description: string;
  course: string;
  creditPrice: number;
  nairaPrice: number;
  ratingSum: number;
  ratingCount: number;
  createdAt: number;
  kind: "pdf" | "video";
  body: string;
  buyers: string[];
}

export interface PurchaseEvent {
  id: string;
  itemId: string;
  itemTitle: string;
  course: string;
  buyerId: string;
  buyerSchool: string;
  t: number;
  method: "credits" | "fiat";
}

export interface WallPost {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  imageData: string | null;
  course: string;
  createdAt: number;
  comments: WallComment[];
}

export interface WallComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  course: string;
  ownerId: string;
  inviteCode: string;
  memberIds: string[];
  messages: DmMessage[];
  createdAt: number;
}

export interface Conversation {
  id: string;
  memberIds: string[];
  messages: DmMessage[];
  updatedAt: number;
  lastRead: Record<string, number>;
}

export interface DmMessage {
  id: string;
  fromId: string;
  toId: string | null;
  kind: "text" | "image" | "voice";
  text: string;
  media: string | null;
  createdAt: number;
  forwardedFrom: string | null;
}

export interface Payout {
  id: string;
  lecturerId: string;
  lecturerName: string;
  amountNaira: number;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

export interface AppFlags {
  maintenance: boolean;
  pauseAi: boolean;
}

export interface ToastItem {
  id: string;
  message: string;
  tone: "ok" | "err" | "info";
}
