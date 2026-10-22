import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { auth, db as firestore } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
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

// ... (Keep the DB interface, emptyDb, loadDb, saveDb, planMeta exactly as they were in the LocalStorage version) ...
// [Paste the DB interface, emptyDb, loadDb, saveDb, and planMeta functions here]

let db = loadDb();
const listeners = new Set<() => void>();
function commit() { saveDb(db); listeners.forEach((l) => l()); }
function findUser(id: string) { return db.users.find((u) => u.id === id); }

// ... (Keep the StoreApi interface exactly as it was) ...
// [Paste the StoreApi interface here]

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [session, setSession] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem("nte_admin") === "1");

  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
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
      }
      setReady(true);
    });
    return () => unsubscribe();
  }, []);

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

  // --- FIREBASE SIGNUP ---
  const signup: StoreApi["signup"] = async (opts) => {
    const email = opts.email.trim().toLowerCase();
    
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, opts.password);
    const firebaseUser = userCredential.user;

    // 2. Create Profile in Firestore
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

  // --- FIREBASE LOGIN ---
  const login: StoreApi["login"] = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
  };

  const googleContinue: StoreApi["googleContinue"] = async (email, name) => {
    // We will skip Google Auth for now, just use standard signup
    throw new Error("Google Auth requires advanced setup."); 
  };

  const logout = async () => {
    if (me) { me.sessionToken = null; commit(); }
    await signOut(auth);
    persistSession(null);
  };

  // --- SYNC CREDITS TO FIRESTORE ---
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

  // ... (Keep all the other LocalStorage functions exactly as they are in your current LocalStorage store.tsx: updateMe, bumpStudy, touchStreak, subscribePlan, uploadNote, saveSet, canGenerate, etc...) ...
  // [Paste the rest of the functions here]

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
