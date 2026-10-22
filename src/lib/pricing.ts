import type { Currency, LecturerPlan, StudentPlan } from "./types";

export const NGN_PER_USD = 1500;

export const STUDENT_PLANS: {
  id: StudentPlan;
  name: string;
  naira: number;
  period: string;
  credits: number;
  devices: number;
  chats: number;
  blurb: string;
  extra?: string;
}[] = [
  {
    id: "free",
    name: "Free",
    naira: 0,
    period: "mo",
    credits: 2,
    devices: 1,
    chats: 20,
    blurb: "Try the pipeline on a couple of pages.",
  },
  {
    id: "starter",
    name: "Starter",
    naira: 3500,
    period: "yr",
    credits: 1000,
    devices: 1,
    chats: 500,
    blurb: "A full session of notes, drills, and tutor time.",
  },
  {
    id: "duo",
    name: "Duo",
    naira: 10000,
    period: "yr",
    credits: 3000,
    devices: 2,
    chats: -1,
    blurb: "Shared credits. Two devices. Unlimited tutor chats.",
  },
  {
    id: "scholar",
    name: "Scholar",
    naira: 15000,
    period: "yr",
    credits: 8000,
    devices: 1,
    chats: -1,
    extra: "1+1 free user",
    blurb: "Deep library plus a seat for someone you study with.",
  },
  {
    id: "king",
    name: "Department King",
    naira: 35000,
    period: "2yrs",
    credits: 25000,
    devices: 30,
    chats: -1,
    blurb: "For a whole class. Thirty devices. Two full years.",
  },
];

export const LECTURER_PLANS: {
  id: LecturerPlan;
  name: string;
  naira: number;
  period: string;
  uploads: number;
  studentPays: number;
  lecturerGets: number;
  blurb: string;
}[] = [
  {
    id: "free",
    name: "Free",
    naira: 0,
    period: "yr",
    uploads: 10,
    studentPays: 100,
    lecturerGets: 70,
    blurb: "Publish a handful of packs. Students pay 100 credits.",
  },
  {
    id: "pro",
    name: "Pro",
    naira: 5000,
    period: "yr",
    uploads: 500,
    studentPays: 200,
    lecturerGets: 170,
    blurb: "Serious catalogue. Higher cut on every sale.",
  },
  {
    id: "elite",
    name: "Elite",
    naira: 7500,
    period: "yr",
    uploads: 3000,
    studentPays: 350,
    lecturerGets: 320,
    blurb: "Department-scale publishing and the best split.",
  },
];

export const PUBLISH_COST = { pdf: 5, video: 20 } as const;
export const MIN_WITHDRAWAL_NGN = 5000;
export const REFERRAL_BONUS = 500;
export const MAX_NOTE_CHARS = 15000;
export const GENERATIONS_PER_HOUR = 5;

export function formatMoney(naira: number, currency: Currency) {
  if (naira === 0) return currency === "NGN" ? "₦0" : "$0";
  if (currency === "NGN") return `₦${naira.toLocaleString("en-NG")}`;
  const usd = naira / NGN_PER_USD;
  return `$${usd.toFixed(usd >= 10 ? 0 : 2)}`;
}

export function periodLabel(period: string) {
  if (period === "mo") return "/mo";
  if (period === "yr") return "/yr";
  if (period === "2yrs") return "/2 yrs";
  return `/${period}`;
}

export function chatsLabel(chats: number) {
  return chats < 0 ? "Unlimited AI chats" : `${chats} AI chats`;
}
