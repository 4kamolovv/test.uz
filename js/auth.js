import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
function normalizeNick(nick) {
  return (nick || "").trim().toLowerCase();
}
export async function registerWithEmail({ email, password, nickname }) {
  const nick = normalizeNick(nickname);

  if (!nick) {
    const e = new Error("Nickname bosh");
    e.code = "nick/empty";
    throw e;
  }
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  try {
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
        createdAt: serverTimestamp(),
      });
    });
    await updateProfile(cred.user, { displayName: nickname.trim() });
    await sendEmailVerification(cred.user);
    await signOut(auth);

    return cred;
  } catch (err) {
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
  if (!user) throw new Error("User yoq. Avval login qiling.");
  await sendEmailVerification(user);
}

export async function logout() {
  await signOut(auth);
}

export function watchUser(cb) {
  return onAuthStateChanged(auth, cb);
}
