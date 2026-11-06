// Renal Ward Log — sign-in and shared storage (Firebase Auth + Firestore).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc,
  setDoc, deleteDoc, getDoc, getDocs, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app$ = document.getElementById("app");
const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k.startsWith("on")) e[k] = v; else e.setAttribute(k, v); }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : String(k)); return e; };
const screen = (...kids) => app$.replaceChildren(h("section", { class: "panel login" }, ...kids));

const cfg = window.FIREBASE_CONFIG || {};
if (!cfg.apiKey || cfg.apiKey === "PASTE_HERE") {
  screen(h("h2", {}, "Setup needed"), h("p", {}, "Paste your Firebase settings into config.js, then upload the folder again."));
  throw new Error("Missing Firebase config");
}

const fb = initializeApp(cfg);
const auth = getAuth(fb);
const db = initializeFirestore(fb, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

// ---------- Store used by app.js ----------
const imgCache = new Map();
let unsub = null;
const Store = window.Store = {
  email: "", isAdmin: false,
  savePatient(p) {
    setDoc(doc(db, "patients", p.id), { data: JSON.stringify(p), by: Store.email, at: serverTimestamp() })
      .catch(err => showError("Couldn't save — " + (err.code || "check the connection")));
  },
  deletePatient(id) { deleteDoc(doc(db, "patients", id)).catch(() => showError("Couldn't delete — check the connection")); },
  async saveImage(src) { const r = await addDoc(collection(db, "images"), { src, by: Store.email, at: serverTimestamp() }); imgCache.set(r.id, src); return r.id; },
  async getImage(id) { if (imgCache.has(id)) return imgCache.get(id); const s = await getDoc(doc(db, "images", id)); const src = s.exists() ? s.data().src : ""; imgCache.set(id, src); return src; },
  deleteImage(id) { if (id) deleteDoc(doc(db, "images", id)).catch(() => {}); imgCache.delete(id); },
  async listAllowed() { const s = await getDocs(collection(db, "allowed")); return s.docs.map(d => ({ email: d.id, role: d.data().role || "member" })).sort((a, b) => a.email.localeCompare(b.email)); },
  setAllowed(email, role) { return setDoc(doc(db, "allowed", email), { role, by: Store.email, at: serverTimestamp() }); },
  removeAllowed(email) { return deleteDoc(doc(db, "allowed", email)); },
};

// ---------- status bar ----------
const syncEl = document.getElementById("sync");
function setSync(text, cls) { syncEl.textContent = text; syncEl.className = "sync " + (cls || ""); }
function showError(msg) { const n = document.getElementById("syncnote"); if (n) n.textContent = msg; }
window.addEventListener("offline", () => setSync("Offline — changes saved on this phone", "warn"));
window.addEventListener("online", () => setSync("Syncing…"));
document.getElementById("signout").onclick = () => { if (unsub) unsub(); signOut(auth).then(() => location.reload()); };

// ---------- sign-in screens ----------
function loginScreen(msg = "") {
  const email = h("input", { type: "email", id: "lg-email", autocomplete: "username", dir: "ltr", placeholder: "you@gmail.com" });
  const pass = h("input", { type: "password", id: "lg-pass", autocomplete: "current-password", placeholder: "Password (6+ characters)" });
  const st = h("p", { class: "sub", "aria-live": "polite" }, msg);
  const go = async (fn) => { st.textContent = "Please wait…"; try { await fn(); } catch (e) { st.textContent = authMsg(e); } };
  screen(h("h2", {}, "Sign in"),
    h("p", { class: "sub" }, "Use the email your admin added to the team list."),
    h("div", { class: "field" }, h("label", { for: "lg-email" }, "Email"), email),
    h("div", { class: "field" }, h("label", { for: "lg-pass" }, "Password"), pass),
    h("div", { class: "row" },
      h("button", { class: "primary", onclick: () => go(() => signInWithEmailAndPassword(auth, email.value.trim(), pass.value)) }, "Sign in"),
      h("button", { onclick: () => go(async () => { const c = await createUserWithEmailAndPassword(auth, email.value.trim(), pass.value); await sendEmailVerification(c.user); }) }, "First time? Create account")),
    h("button", { class: "link", onclick: () => go(async () => { await sendPasswordResetEmail(auth, email.value.trim()); st.textContent = "Password reset email sent."; }) }, "Forgot password"),
    st);
}
function authMsg(e) {
  const c = e.code || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "Email or password is wrong.";
  if (c.includes("email-already-in-use")) return "This email already has an account — use Sign in.";
  if (c.includes("weak-password")) return "Use a password of at least 6 characters.";
  if (c.includes("invalid-email")) return "Write a valid email.";
  if (c.includes("network")) return "No connection — try again when online.";
  if (c.includes("too-many-requests")) return "Too many tries — wait a few minutes.";
  return "Something went wrong (" + (c || "unknown") + ").";
}
function verifyScreen(user) {
  const st = h("p", { class: "sub", "aria-live": "polite" });
  screen(h("h2", {}, "Confirm your email"),
    h("p", {}, "We sent a link to ", h("b", { dir: "ltr" }, user.email), ". Open it, then tap Continue."),
    h("div", { class: "row" },
      h("button", { class: "primary", onclick: async () => { await user.reload(); if (auth.currentUser.emailVerified) { await auth.currentUser.getIdToken(true); start(auth.currentUser); } else st.textContent = "Not confirmed yet — check your inbox and spam."; } }, "Continue"),
      h("button", { onclick: () => sendEmailVerification(user).then(() => st.textContent = "Sent again.").catch(e => st.textContent = authMsg(e)) }, "Send again"),
      h("button", { class: "link", onclick: () => signOut(auth) }, "Use another email")), st);
}
function notAllowedScreen(user) {
  screen(h("h2", {}, "Not on the team list yet"),
    h("p", {}, h("b", { dir: "ltr" }, user.email), " can't open patient data. Ask the admin to add this exact email, then tap Try again."),
    h("div", { class: "row" }, h("button", { class: "primary", onclick: () => start(user) }, "Try again"), h("button", { class: "link", onclick: () => signOut(auth) }, "Sign out")));
}

// ---------- start ----------
async function start(user) {
  const email = (user.email || "").toLowerCase();
  let allowed;
  try { allowed = await getDoc(doc(db, "allowed", email)); }
  catch (e) { if (String(e.code).includes("permission")) return notAllowedScreen(user); screen(h("h2", {}, "Can't connect"), h("p", {}, "Check the internet connection, then reload.")); return; }
  if (!allowed.exists()) return notAllowedScreen(user);
  Store.email = email; Store.isAdmin = allowed.data().role === "admin";
  document.getElementById("whoami").textContent = email;
  document.getElementById("userbar").hidden = false;
  setSync(navigator.onLine ? "Syncing…" : "Offline — changes saved on this phone", navigator.onLine ? "" : "warn");
  let started = false;
  unsub = onSnapshot(collection(db, "patients"), { includeMetadataChanges: true }, snap => {
    if (snap.metadata.hasPendingWrites) setSync(navigator.onLine ? "Saving…" : "Offline — changes saved on this phone", "warn");
    else if (snap.metadata.fromCache && !navigator.onLine) setSync("Offline", "warn");
    else setSync("All saved", "ok");
    const list = [];
    for (const d of snap.docs) { try { list.push(JSON.parse(d.data().data)); } catch {} }
    if (!started) { started = true; window.onRemotePatients(list); window.startApp(); }
    else if (snap.docChanges().length) window.onRemotePatients(list);
  }, err => { showError("Lost access to data (" + (err.code || "error") + "). Reload the app."); });
}

onAuthStateChanged(auth, user => {
  if (!user) { document.getElementById("userbar").hidden = true; return loginScreen(); }
  if (!user.emailVerified) return verifyScreen(user);
  start(user);
});
