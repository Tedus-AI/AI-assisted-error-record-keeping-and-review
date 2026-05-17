import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type { ParentSecurityProfile } from "../types";

const LOCAL_SECURITY_KEY = "ai-mistake-review-parent-security-v1";

function localSecurityKey(userId: string) {
  return `${LOCAL_SECURITY_KEY}:${userId}`;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(new Uint8Array(digest));
}

export async function hashParentPin(pin: string, salt: string) {
  return sha256Hex(`${salt}:${pin}`);
}

export async function getParentSecurityProfile(
  userId: string
): Promise<ParentSecurityProfile | null> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const snapshot = await getDoc(doc(db, "users", userId, "settings", "security"));
    return snapshot.exists() ? (snapshot.data() as ParentSecurityProfile) : null;
  }

  const raw = localStorage.getItem(localSecurityKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParentSecurityProfile;
  } catch {
    return null;
  }
}

export async function saveParentPin(
  userId: string,
  pin: string
): Promise<ParentSecurityProfile> {
  const current = await getParentSecurityProfile(userId);
  const now = new Date().toISOString();
  const salt = randomSalt();
  const profile: ParentSecurityProfile = {
    pinHash: await hashParentPin(pin, salt),
    salt,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db && userId !== "demo_user") {
    await setDoc(doc(db, "users", userId, "settings", "security"), profile);
    return profile;
  }

  localStorage.setItem(localSecurityKey(userId), JSON.stringify(profile));
  return profile;
}

export async function verifyParentPin(
  profile: ParentSecurityProfile,
  pin: string
) {
  const hash = await hashParentPin(pin, profile.salt);
  return hash === profile.pinHash;
}
