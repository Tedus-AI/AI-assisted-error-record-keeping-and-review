import {
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";
import { getLocalUser, setLocalUser } from "./localStore";
import type { AppUser } from "../types";

const demoUser = (email = "parent@example.com"): AppUser => ({
  id: "demo_user",
  email,
  displayName: "Tedus 家長",
  isDemo: true,
});

function fromFirebaseUser(user: User | null): AppUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email ?? "firebase-user@example.com",
    displayName: user.displayName ?? "家長",
  };
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (isFirebaseConfigured && auth) {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithEmailAndPassword(auth, email, password);
    return fromFirebaseUser(result.user) as AppUser;
  }

  const user = demoUser(email);
  setLocalUser(user);
  return user;
}

export async function signUp(email: string, password: string): Promise<AppUser> {
  if (isFirebaseConfigured && auth) {
    await setPersistence(auth, browserLocalPersistence);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return fromFirebaseUser(result.user) as AppUser;
  }

  const user = demoUser(email);
  setLocalUser(user);
  return user;
}

export async function signInWithGoogle(): Promise<AppUser> {
  if (!isFirebaseConfigured || !auth) {
    const user = demoUser();
    setLocalUser(user);
    return user;
  }

  const provider = new GoogleAuthProvider();
  await setPersistence(auth, browserLocalPersistence);
  const result = await signInWithPopup(auth, provider);
  return fromFirebaseUser(result.user) as AppUser;
}

export async function signOut(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await firebaseSignOut(auth);
    return;
  }

  setLocalUser(null);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isFirebaseConfigured && auth) {
    const activeAuth = auth;
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(activeAuth, (user) => {
        unsubscribe();
        resolve(fromFirebaseUser(user));
      });
    });
  }

  return getLocalUser();
}

export function getDemoUser() {
  const user = demoUser();
  setLocalUser(user);
  return user;
}
