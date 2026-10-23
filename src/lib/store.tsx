import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { auth, db as firestore } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { sha256 } from "./crypto";
import { deviceId, referralCode, todayKey, uid } from "./id";
import { idbSet } from "./idb";
import {
  GENERATIONS_PER_HOUR, LECTURER_PLANS, MAX_NOTE_CHARS, MIN_WITHDRAWAL_NGN,
  PUBLISH_COST, REFERRAL_BONUS, STUDENT_PLANS,
} from "./pricing";
import type {
  AppFlags, CbtAttempt, ChatMessage, Conversation, Currency, DmMessage,
  LecturerPlan, MarketItem, NoteDoc, Payout, PurchaseEvent, QuestionSet,
  Role, StudentPlan, StudyGroup, ToastItem, TutorThread, User, WallPost,
} from "./types";

const DB_KEY = "nte_db_v1";
const SESSION_KEY = "nte_session";

interface DB {
  users: User[];
  notes: NoteDoc[];
  sets: QuestionSet[];
  attempts: CbtAttempt[];
  threads: TutorThread[];
  market: MarketItem[];
  purchases: PurchaseEvent[];
  wall: WallPost[];
  groups: StudyGroup[];
  convos: Conversation[];
  payouts: Payout[];
  flags: AppFlags;
}

function emptyDb(): DB {
  return {
    users: [], notes: [], sets: [], attempts: [], threads: [], market: [],
    purchases: [], wall: [], groups: [], convos: [], payouts: [],
    flags: { maintenance: false, pauseAi: false },
  };
}

function loadDb(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return emptyDb();
    return { ...emptyDb(), ...JSON.parse(raw) } as DB;
  } catch {
    return emptyDb();
  }
}

function saveDb(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function planMeta(plan: StudentPlan) {
  return STUDENT_PLANS.find((p) => p.id === plan)!;
}

let db = loadDb();
const listeners = new Set<() => void>();

function commit() {
  saveDb(db);
  listeners.forEach((l) => l());
}

function findUser(id: string) {
  return db.users.find((u) => u.id === id);
}

export interface StoreApi {
  ready: boolean;
  currency: Currency;
  me: User | null;
  db: DB;
  toasts: ToastItem[];
  toast: (message: string, tone?: ToastItem["tone"]) => void;
  dismissToast: (id: string) => void;
  signup: (opts: any) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  googleContinue: () => Promise<void>;
  logout: () => Promise<void>;
  updateMe: (patch: Partial<User>) => Promise<void>;
  bumpStudy: (seconds: number) => void;
  touchStreak: () => void;
  addCredits: (userId: string, delta: number) => Promise<void>;
  subscribePlan: (plan: StudentPlan) => void;
  subscribeLecturer: (plan: LecturerPlan) => void;
  uploadNote: (note: any) => NoteDoc;
  saveSet: (set: any) => QuestionSet;
  recordGeneration: () => { ok: boolean; reason?: string };
  refundCredits: (n: number) => void;
  canGenerate: () => { ok: boolean; reason?: string };
  saveAttempt: (a: Omit<CbtAttempt, "id">) => CbtAttempt;
  upsertThread: (t: TutorThread) => void;
  addTutorMessage: (threadId: string, msg: ChatMessage) => void;
  publishItem: (item: any) => MarketItem;
  buyWithCredits: (itemId: string) => void;
  buyWithFiat: (itemId: string) => void;
  rateItem: (itemId: string, stars: number) => void;
  addWallPost: (p: any) => void;
  addWallComment: (postId: string, text: string) => void;
  createGroup: (name: string, course: string) => StudyGroup;
  joinGroup: (code: string) => StudyGroup;
  postGroupMessage: (groupId: string, msg: any) => void;
  openConvo: (otherId: string) => Conversation;
  sendDm: (convoId: string, msg: any) => void;
  forwardDm: (convoId: string, msg: DmMessage, toUserId: string) => void;
  markConvoRead: (convoId: string) => void;
  requestPayout: (amountNaira: number) => Payout;
  adminLogin: (email: string, password: string, otp: string) => Promise<boolean>;
  adminLogout: () => void;
  isAdmin: boolean;
  setFlags: (f: Partial<AppFlags>) => void;
  adminForceLogout: (userId: string) => void;
  adminBan: (userId: string, banned: boolean) => void;
  adminGrant: (userId: string, credits: number) => void;
  adminApprovePayout: (id: string, approve: boolean) => void;
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [session, setSession] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem("nte_admin") === "1");

  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  // FIREBASE AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const docRef = doc(firestore, "profiles", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const cloudData = docSnap.data();
            let localUser = db.users.find(u => u.id === firebaseUser.uid);
            if (!localUser) {
              localUser = { ...cloudData, id: firebaseUser.uid, sessionToken: uid("ses"), activeDeviceId: deviceId() } as User;
              db.users.push(localUser);
            } else {
              localUser.credits = cloudData.credits;
              localUser.sessionToken = uid("ses");
            }
            commit();
            persistSession(localUser.sessionToken);
          }
        } else {
          persistSession(null);
        }
      } catch (error) {
        console.error("Auth listener error:", error);
      } finally {
        setReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- NEW: CLEANUP EXPIRED MEDIA (Older than 7 days) ---
  useEffect(() => {
    if (!ready) return; 
    
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let changed = false;

    // Clean up Direct Messages
    db.convos.forEach(c => {
      c.messages.forEach(m => {
        if ((m.kind === "voice" || m.kind === "image") && m.media && (now - m.createdAt > ONE_WEEK_MS)) {
          m.media = ""; // Delete the heavy file data to save space
          changed = true;
        }
      });
    });

    // Clean up Group Messages
    db.groups.forEach(g => {
      g.messages.forEach(m => {
        if ((m.kind === "voice" || m.kind === "image") && m.media && (now - m.createdAt > ONE_WEEK_MS)) {
          m.media = "";
          changed = true;
        }
      });
    });

    if (changed) {
      commit(); 
      console.log("Cleaned up old media to save storage.");
    }
  }, [ready]);

  const toast = useCallback((message: string, tone: ToastItem["tone"] = "info") => {
    const id = uid("t");
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const me = useMemo(() => {
    if (!session) return null;
    const u = db.users.find((x) => x.sessionToken === session && !x.banned);
    if (!u) return null;
    return u;
  }, [session, tick]);

  const persistSession = (token: string | null) => {
    setSession(token);
    if (token) localStorage.setItem(SESSION_KEY, token);
    else localStorage.removeItem(SESSION_KEY);
  };

  const activate = (user: User) => {
    const token = uid("ses");
    user.sessionToken = token;
    user.activeDeviceId = deviceId();
    commit();
    persistSession(token);
    return user;
  };

  const signup: StoreApi["signup"] = async (opts) => {
    const email = opts.email.trim().toLowerCase();
    if (db.users.some((u) => u.email === email)) throw new Error("Email already has an account.");
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, opts.password);
    const firebaseUser = userCredential.user;

    const plan = planMeta("free");
    const user: User = {
      id: firebaseUser.uid, email, name: opts.name.trim() || email.split("@")[0], matric: opts.matric.trim(),
      passwordHash: await sha256(opts.password), role: opts.role, studentPlan: "free", lecturerPlan: "free", credits: plan.credits,
      chatsUsed: 0, chatCap: plan.chats, devicesAllowed: plan.devices, activeDeviceId: deviceId(), sessionToken: null, banned: false,
      createdAt: Date.now(), referralCode: referralCode(), referredBy: null, googleLinked: false, streak: 0, lastStudyDay: null, studySeconds: {},
      knowledgePoints: 0, weakTopics: {}, generations: [], lecturerCredits: 0, lecturerNaira: 0, school: opts.school.trim(), courseFocus: "",
      learningStage: opts.learningStage || "university", lecturerVerify: "", avatar: "", age: "", classLevel: "", department: "",
    };

    await setDoc(doc(firestore, "profiles", firebaseUser.uid), {
      email: user.email, name: user.name, matric: user.matric, role: user.role, credits: user.credits
    });

    db.users.push(user);
    activate(user);
    return user;
  };

  const login: StoreApi["login"] = async (email, password) => {
    const e = email.trim().toLowerCase();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, e, password);
      const firebaseUser = userCredential.user;
      
      const docRef = doc(firestore, "profiles", firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      
      let user = db.users.find(u => u.id === firebaseUser.uid);
      if (!user && docSnap.exists()) {
          user = { ...docSnap.data(), id: firebaseUser.uid, sessionToken: null } as User; 
          db.users.push(user);
      }
      
      if (user) return activate(user);
      throw new Error("User profile not found.");
    } catch (err: any) {
      const hash = await sha256(password);
      const localUser = db.users.find((u) => u.email === e && u.passwordHash === hash);
      if (localUser) return activate(localUser);
      throw new Error("Email or password is incorrect.");
    }
  };

  // GOOGLE POPUP LOGIN
  const googleContinue: StoreApi["googleContinue"] = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
         const firebaseUser = result.user;
         const docRef = doc(firestore, "profiles", firebaseUser.uid);
         const docSnap = await getDoc(docRef);
         
         if (!docSnap.exists()) {
           const plan = planMeta("free");
           await setDoc(docRef, {
             email: firebaseUser.email,
             name: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
             matric: "",
             role: "student",
             credits: plan.credits,
           });
         }
         
         const docSnapAfter = await getDoc(docRef);
         if (docSnapAfter.exists()) {
           const cloudData = docSnapAfter.data();
           let localUser = db.users.find(u => u.id === firebaseUser.uid);
           if (!localUser) {
             localUser = { ...cloudData, id: firebaseUser.uid, sessionToken: uid("ses"), activeDeviceId: deviceId() } as User;
             db.users.push(localUser);
           } else {
             localUser.credits = cloudData.credits;
             localUser.sessionToken = uid("ses");
           }
           commit();
           persistSession(localUser.sessionToken);
         }
      }
    } catch (error: any) {
      throw new Error(error.message || "Google sign-in failed.");
    }
  };

  const logout = async () => {
    if (me) { me.sessionToken = null; commit(); }
    await signOut(auth);
    persistSession(null);
  };

  const updateMe = async (patch: Partial<User>) => {
    if (!me) return;
    Object.assign(me, patch); 
    commit();
    try {
      await updateDoc(doc(firestore, "profiles", me.id), patch);
    } catch (error) {
      console.error("Failed to save profile to cloud:", error);
    }
  };

  const bumpStudy = (seconds: number) => { if (!me) return; const k = todayKey(); me.studySeconds = { ...me.studySeconds, [k]: (me.studySeconds[k] || 0) + seconds }; commit(); };
  const touchStreak = () => { if (!me) return; const k = todayKey(); if (me.lastStudyDay === k) return; const y = new Date(); y.setDate(y.getDate() - 1); const yk = todayKey(y); me.streak = me.lastStudyDay === yk ? me.streak + 1 : 1; me.lastStudyDay = k; commit(); };
  const subscribePlan = (plan: StudentPlan) => { if (!me) return; const meta = planMeta(plan); me.studentPlan = plan; me.credits += meta.credits; me.chatCap = meta.chats; me.devicesAllowed = meta.devices; commit(); };
  const subscribeLecturer = (plan: LecturerPlan) => { if (!me) return; me.lecturerPlan = plan; me.role = "lecturer"; commit(); };
  
  const uploadNote: StoreApi["uploadNote"] = (note) => {
    if (!me) throw new Error("Sign in first.");
    const doc: NoteDoc = { ...note, id: uid("note"), ownerId: me.id, createdAt: Date.now(), charCount: Math.min(note.charCount, MAX_NOTE_CHARS), text: note.text.slice(0, MAX_NOTE_CHARS) };
    db.notes.push(doc); void idbSet("notes", doc.id, doc); commit(); return doc;
  };

  const saveSet: StoreApi["saveSet"] = (set) => {
    if (!me) throw new Error("Sign in first.");
    const row: QuestionSet = { ...set, id: uid("set"), ownerId: me.id, createdAt: Date.now(), attempts: 0, lastScore: null };
    db.sets.push(row); void idbSet("sets", row.id, row); commit(); return row;
  };

  const canGenerate = () => {
    if (!me) return { ok: false, reason: "Sign in to generate questions." };
    if (db.flags.pauseAi) return { ok: false, reason: "The tutor is paused right now." };
    const hourAgo = Date.now() - 60 * 60 * 1000;
    me.generations = me.generations.filter((g) => g.t > hourAgo);
    if (me.generations.length >= GENERATIONS_PER_HOUR) return { ok: false, reason: "Hourly limit reached." };
    return { ok: true };
  };

  const recordGeneration = () => { const gate = canGenerate(); if (!gate.ok) return gate; me!.generations.push({ t: Date.now() }); commit(); return { ok: true }; };
  const refundCredits = (n: number) => { if (!me) return; me.credits += n; commit(); };
  const saveAttempt: StoreApi["saveAttempt"] = (a) => { const row: CbtAttempt = { ...a, id: uid("att") }; db.attempts.push(row); commit(); return row; };
  const upsertThread = (t: TutorThread) => { const i = db.threads.findIndex((x) => x.id === t.id); if (i >= 0) db.threads[i] = t; else db.threads.push(t); commit(); };
  const addTutorMessage = (threadId: string, msg: ChatMessage) => { const t = db.threads.find((x) => x.id === threadId); if (!t) return; t.messages.push(msg); t.updatedAt = Date.now(); if (me) me.chatsUsed += msg.role === "user" ? 1 : 0; commit(); };
  
  const publishItem: StoreApi["publishItem"] = (item) => {
    if (!me) throw new Error("Sign in first.");
    if (me.role !== "lecturer") throw new Error("You must register as a Lecturer.");
    const cost = item.kind === "video" ? PUBLISH_COST.video : PUBLISH_COST.pdf;
    if (me.credits < cost) throw new Error(`Publishing needs ${cost} credits.`);
    me.credits -= cost;
    const row: MarketItem = { ...item, id: uid("mkt"), sellerId: me.id, sellerName: me.name, createdAt: Date.now(), buyers: [], ratingSum: 0, ratingCount: 0 };
    db.market.push(row); commit(); return row;
  };

  const buyWithCredits = (itemId: string) => { if (!me) throw new Error("Sign in first."); const item = db.market.find((m) => m.id === itemId); if (!item) throw new Error("Gone."); if (item.buyers.includes(me.id)) throw new Error("You own this."); if (me.credits < item.creditPrice) throw new Error("Not enough credits."); me.credits -= item.creditPrice; item.buyers.push(me.id); commit(); };
  const buyWithFiat = (itemId: string) => { if (!me) throw new Error("Sign in first."); const item = db.market.find((m) => m.id === itemId); if (!item) throw new Error("Gone."); item.buyers.push(me.id); commit(); };
  const rateItem = (itemId: string, stars: number) => { const item = db.market.find((m) => m.id === itemId); if (!item || !me || !item.buyers.includes(me.id)) return; item.ratingSum += stars; item.ratingCount += 1; commit(); };
  const addWallPost: StoreApi["addWallPost"] = (p) => { if (!me) throw new Error("Sign in first."); db.wall.unshift({ ...p, id: uid("wall"), authorId: me.id, authorName: me.name, createdAt: Date.now(), comments: [] }); commit(); };
  const addWallComment = (postId: string, text: string) => { if (!me) return; const post = db.wall.find((w) => w.id === postId); if (!post) return; post.comments.push({ id: uid("cmt"), authorId: me.id, authorName: me.name, text, createdAt: Date.now() }); commit(); };
  const createGroup = (name: string, course: string) => { if (!me) throw new Error("Sign in first."); const g: StudyGroup = { id: uid("grp"), name, course, ownerId: me.id, inviteCode: referralCode(), memberIds: [me.id], messages: [], createdAt: Date.now() }; db.groups.push(g); commit(); return g; };
  const joinGroup = (code: string) => { if (!me) throw new Error("Sign in first."); const g = db.groups.find((x) => x.inviteCode.toLowerCase() === code.trim().toLowerCase()); if (!g) throw new Error("No group found."); if (!g.memberIds.includes(me.id)) g.memberIds.push(me.id); commit(); return g; };
  const postGroupMessage: StoreApi["postGroupMessage"] = (groupId, msg) => { if (!me) return; const g = db.groups.find((x) => x.id === groupId); if (!g || !g.memberIds.includes(me.id)) return; g.messages.push({ ...msg, id: uid("gm"), fromId: me.id, createdAt: Date.now() }); commit(); };
  const openConvo = (otherId: string) => { if (!me) throw new Error("Sign in first."); let c = db.convos.find((x) => x.memberIds.includes(me.id) && x.memberIds.includes(otherId)); if (!c) { c = { id: uid("dm"), memberIds: [me.id, otherId], messages: [], updatedAt: Date.now(), lastRead: { [me.id]: Date.now() } }; db.convos.push(c); commit(); } return c; };
  const markConvoRead = (convoId: string) => { if (!me) return; const c = db.convos.find((x) => x.id === convoId); if (!c) return; c.lastRead = { ...(c.lastRead || {}), [me.id]: Date.now() }; commit(); };
  const sendDm: StoreApi["sendDm"] = (convoId, msg) => { if (!me) return; const c = db.convos.find((x) => x.id === convoId); if (!c) return; c.messages.push({ ...msg, id: uid("msg"), fromId: me.id, createdAt: Date.now() }); c.updatedAt = Date.now(); commit(); };
  const forwardDm = (convoId: string, msg: DmMessage, toUserId: string) => { if (!me) return; const dest = openConvo(toUserId); dest.messages.push({ ...msg, id: uid("msg"), fromId: me.id, toId: toUserId, forwardedFrom: msg.fromId, createdAt: Date.now() }); dest.updatedAt = Date.now(); commit(); };
  const requestPayout = (amountNaira: number) => { if (!me) throw new Error("Sign in first."); if (amountNaira < MIN_WITHDRAWAL_NGN) throw new Error(`Min is ₦${MIN_WITHDRAWAL_NGN}`); if (me.lecturerNaira < amountNaira) throw new Error("Not enough."); me.lecturerNaira -= amountNaira; const p: Payout = { id: uid("pay"), lecturerId: me.id, lecturerName: me.name, amountNaira, status: "pending", createdAt: Date.now() }; db.payouts.push(p); commit(); return p; };
  
  const addCredits = async (userId: string, delta: number) => {
    const u = findUser(userId);
    if (!u) return;
    u.credits = Math.max(0, u.credits + delta);
    commit();
    try {
      await updateDoc(doc(firestore, "profiles", userId), { credits: u.credits });
    } catch (e) {
      console.error("Failed to sync credits to cloud", e);
    }
  };

  const adminLogin = async (email: string, password: string, otp: string) => {
    const e = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim();
    const p = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim();
    const o = (import.meta.env.VITE_ADMIN_2FA as string | undefined)?.trim();
    if (!e || !p || !o) throw new Error("Admin locked.");
    if (email.trim().toLowerCase() !== e.toLowerCase() || password !== p || otp.trim() !== o) throw new Error("Wrong details.");
    sessionStorage.setItem("nte_admin", "1"); setIsAdmin(true); return true;
  };

  const adminLogout = () => { sessionStorage.removeItem("nte_admin"); setIsAdmin(false); };
  const setFlags = (f: Partial<AppFlags>) => { db.flags = { ...db.flags, ...f }; commit(); };
  const adminForceLogout = (userId: string) => { const u = findUser(userId); if (!u) return; u.sessionToken = null; u.activeDeviceId = null; commit(); };
  const adminBan = (userId: string, banned: boolean) => { const u = findUser(userId); if (!u) return; u.banned = banned; if (banned) { u.sessionToken = null; u.activeDeviceId = null; } commit(); };
  const adminGrant = (userId: string, credits: number) => { addCredits(userId, credits); };
  const adminApprovePayout = (id: string, approve: boolean) => { const p = db.payouts.find((x) => x.id === id); if (!p) return; p.status = approve ? "approved" : "rejected"; if (!approve) { const u = findUser(p.lecturerId); if (u) u.lecturerNaira += p.amountNaira; } commit(); };

  const api: StoreApi = {
    ready, currency, me, db, toasts, toast, dismissToast, signup, login, googleContinue, logout, updateMe, bumpStudy, touchStreak, addCredits, subscribePlan, subscribeLecturer, uploadNote, saveSet, recordGeneration, refundCredits, canGenerate, saveAttempt, upsertThread, addTutorMessage, publishItem, buyWithCredits, buyWithFiat, rateItem, addWallPost, addWallComment, createGroup, joinGroup, postGroupMessage, openConvo, sendDm, forwardDm, markConvoRead, requestPayout, adminLogin, adminLogout, isAdmin, setFlags, adminForceLogout, adminBan, adminGrant, adminApprovePayout,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("store");
  return ctx;
}
