// /js/auth.js
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// helper: nickname normalize
function normalizeNick(nick) {
  return (nick || "").trim().toLowerCase();
}

// Register + email verify link + nickname unique
export async function registerWithEmail({ email, password, nickname }) {
  const nick = normalizeNick(nickname);

  if (!nick) {
    const e = new Error("Nickname bo‘sh");
    e.code = "nick/empty";
    throw e;
  }

  // 1) avval user yaratamiz
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  try {
    // 2) transaction: nicknames/{nick} bandmi yo‘qmi
    const nickRef = doc(db, "nicknames", nick);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(nickRef);
      if (snap.exists()) {
        const e = new Error("Nickname taken");
        e.code = "nick/taken";
        throw e;
      }
      tx.set(nickRef, {
        uid: cred.user.uid,
        createdAt: serverTimestamp()
      });
    });

    // 3) displayName yozamiz (nick original ko‘rinishda chiqsin desang nickname’ni qo‘y)
    await updateProfile(cred.user, { displayName: nickname.trim() });

    // 4) email verification yuboramiz
    await sendEmailVerification(cred.user);

    // 5) verify qilmaguncha logout
    await signOut(auth);

    return cred;
  } catch (err) {
    // agar nick band bo‘lsa, yaratib qo‘yilgan userni tozalash kerak bo‘ladi
    // Client SDK bilan userni delete qilish mumkin:
    try {
      await cred.user.delete();
    } catch (_) {}

    throw err;
  }
}

export async function loginWithEmail({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred;
}

export async function resendVerification() {
  const user = auth.currentUser;
  if (!user) throw new Error("User yo‘q. Avval login qiling.");
  await sendEmailVerification(user);
}

export async function logout() {
  await signOut(auth);
}

export function watchUser(cb) {
  return onAuthStateChanged(auth, cb);
}
