// Nephrology Ward Log — sign-in and shared storage (Firebase Auth + Firestore).
// Data: patients/{id} {d: flat map, active}, meta/directory (all patients, small), meta/counter, meta/settings, history, trash, images.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc,
  setDoc, updateDoc, deleteDoc, getDoc, getDocs, addDoc, onSnapshot, serverTimestamp, writeBatch, query, orderBy, limit, where,
  FieldPath, deleteField, runTransaction, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
// Each patient document keeps a flat map "d" of small fields; a save sends only the fields that changed,
// so two doctors editing the same patient never overwrite each other.
const imgCache = new Map();
let unsubs = [];
const P = id => doc(db, "patients", id);
const dirRef = () => doc(db, "meta", "directory");
const fail = what => err => showError("Couldn't " + what + " — " + (err && err.code ? err.code.replace("firestore/", "") : "check the connection") + ".");
const Store = window.Store = {
  email: "", isAdmin: false,
  createPatient(id, d, active) { setDoc(P(id), { v: 2, d, active: !!active, by: Store.email, at: serverTimestamp() }).catch(fail("save")); },
  updatePatient(id, ch, active) {
    const args = ["by", Store.email, "at", serverTimestamp(), "active", !!active];
    for (const [k, v] of Object.entries(ch)) args.push(new FieldPath("d", k), v === null ? deleteField() : v);
    updateDoc(P(id), ...args).catch(fail("save"));
  },
  async getPatient(id) { const s = await getDoc(P(id)); if (!s.exists()) return null; const x = s.data(); return x.d ? { id, d: x.d } : { id, data: x.data }; },
  async saveImage(src) { const r = await addDoc(collection(db, "images"), { src, by: Store.email, at: serverTimestamp() }); imgCache.set(r.id, src); return r.id; },
  async getImage(id) { if (imgCache.has(id)) return imgCache.get(id); const s = await getDoc(doc(db, "images", id)); const src = s.exists() ? s.data().src : ""; imgCache.set(id, src); return src; },
  deleteImage(id) { if (id) deleteDoc(doc(db, "images", id)).catch(() => {}); imgCache.delete(id); },
  addHistory(h) { setDoc(doc(db, "history", h.id), h).catch(fail("log the change")); },
  trashAdd(t) { setDoc(doc(db, "trash", t.id), t).catch(fail("keep the deleted item")); },
  trashDelete(id) { deleteDoc(doc(db, "trash", id)).catch(() => {}); },
  trashPatient(pid, t) { const b = writeBatch(db); b.set(doc(db, "trash", t.id), t); b.delete(P(pid)); b.commit().catch(fail("delete")); },
  setDir(id, entry) {
    if (entry) setDoc(dirRef(), { p: { [id]: entry } }, { merge: true }).catch(() => {});
    else updateDoc(dirRef(), new FieldPath("p", id), deleteField()).catch(() => {});
  },
  async allocCode(max) {
    const n = await runTransaction(db, async tx => { const r = doc(db, "meta", "counter"); const s = await tx.get(r); let cur;
      if (s.exists()) cur = s.data().n;
      else { const ds = await tx.get(dirRef()); const all = ds.exists() ? Object.values(ds.data().p || {}) : [];
        cur = Math.max(max || 0, 0, ...all.map(x => +((String(x.c || "").match(/^NW-(\d+)/) || [0, 0])[1]))); }
      tx.set(r, { n: cur + 1, by: Store.email }); return cur + 1; });
    return "NW-" + String(n).padStart(4, "0");
  },
  saveSettings(x) { setDoc(doc(db, "meta", "settings"), { ...x, by: Store.email, at: serverTimestamp() }).catch(fail("save the settings")); },
  async historyCount() { const s = await getCountFromServer(collection(db, "history")); return s.data().count; },
  async listAllowed() { const s = await getDocs(collection(db, "allowed")); return s.docs.map(d => ({ email: d.id, role: d.data().role || "member" })).sort((a, b) => a.email.localeCompare(b.email)); },
  setAllowed(email, role) { return setDoc(doc(db, "allowed", email), { role, by: Store.email, at: serverTimestamp() }); },
  removeAllowed(email) { return deleteDoc(doc(db, "allowed", email)); },
};

// one-time move from the old format (whole patient as one text) to the new one
async function migrate() {
  const snap = await getDocs(collection(db, "patients"));
  let b = writeBatch(db), n = 0; const entries = {};
  const flush = async () => { if (n) { await b.commit(); b = writeBatch(db); n = 0; } };
  for (const d of snap.docs) {
    const x = d.data(); let p;
    if (x.d) p = window.appUnflat(d.id, x.d); else { try { p = JSON.parse(x.data); p.id = d.id; } catch { continue; } }
    const c = window.appConvert(p); entries[d.id] = c.entry;
    b.set(P(d.id), { v: 2, d: c.d, active: c.active, by: Store.email, at: serverTimestamp() }); if (++n >= 400) await flush();
  }
  if (Store.isAdmin) { const tr = await getDocs(collection(db, "trash"));
    for (const d of tr.docs) { const x = d.data(); if (x.kind) continue;
      try { const p = JSON.parse(x.data); p.id = p.id || d.id; const c = window.appConvert(p); const id = d.id + "_v2";
        b.set(doc(db, "trash", id), { id, kind: "patient", pid: p.id, pname: p.name || "", label: "Whole file (" + (p.code || "") + ") — deleted by " + (x.by || "?"), kj: JSON.stringify(c.d), at: x.at || "", by: Store.email, ts: Date.now() });
        b.delete(doc(db, "trash", d.id)); n += 2; if (n >= 400) await flush(); } catch {} } }
  b.set(dirRef(), { p: entries }); n++;
  await flush();
}

// ---------- status bar ----------
const syncEl = document.getElementById("sync");
function setSync(text, cls) { const st = /^Offline/.test(text) ? "offline" : cls === "ok" ? "saved" : "saving"; if (window.setSyncState) window.setSyncState(st); }
function showError(msg) { const n = document.getElementById("syncnote"); if (n) n.textContent = msg; }
window.addEventListener("offline", () => setSync("Offline — changes saved on this phone", "warn"));
window.addEventListener("online", () => setSync("Syncing…"));
document.getElementById("signout").onclick = () => { unsubs.forEach(f => f()); unsubs = []; signOut(auth).then(() => location.reload()); };

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
  document.getElementById("signout").hidden = false;
  document.getElementById("syncpill").hidden = false;
  setSync(navigator.onLine ? "Syncing…" : "Offline — changes saved on this phone", navigator.onLine ? "" : "warn");
  try { const ds = await getDoc(dirRef()); if (!ds.exists()) { screen(h("p", { class: "sub" }, "Updating the data to the new format… (one time only)")); await migrate(); } }
  catch (e) { if (navigator.onLine) showError("Couldn't update the data format (" + (e.code || "error") + "). Reload the app."); }
  unsubs.forEach(f => f()); unsubs = [];
  unsubs.push(onSnapshot(dirRef(), s => window.onRemoteDir((s.exists() && s.data().p) || {}), () => {}));
  unsubs.push(onSnapshot(doc(db, "meta", "settings"), s => window.onRemoteSettings(s.exists() ? s.data() : null), () => {}));
  unsubs.push(onSnapshot(collection(db, "trash"), snap => {
    const list = snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(x => x.kind);
    list.sort((a, b) => (b.ts || 0) - (a.ts || 0)); window.onRemoteTrash(list);
  }, () => {}));
  if (Store.isAdmin) unsubs.push(onSnapshot(query(collection(db, "history"), orderBy("ts", "desc"), limit(500)), snap => {
    window.onRemoteHistory(snap.docs.map(d => d.data()));
  }, () => {}));
  let started = false;
  unsubs.push(onSnapshot(query(collection(db, "patients"), where("active", "==", true)), { includeMetadataChanges: true }, snap => {
    if (snap.metadata.hasPendingWrites) setSync(navigator.onLine ? "Saving…" : "Offline — changes saved on this phone", "warn");
    else if (snap.metadata.fromCache && !navigator.onLine) setSync("Offline", "warn");
    else setSync("All saved", "ok");
    const list = snap.docs.map(d => { const x = d.data(); return x.d ? { id: d.id, d: x.d } : { id: d.id, data: x.data }; });
    if (!started) { started = true; window.onRemotePatients(list); window.startApp(); }
    else if (snap.docChanges().length) window.onRemotePatients(list);
  }, err => { showError("Lost access to data (" + (err.code || "error") + "). Reload the app."); }));
}

onAuthStateChanged(auth, user => {
  if (!user) { document.getElementById("userbar").hidden = true; document.getElementById("syncpill").hidden = true; return loginScreen(); }
  if (!user.emailVerified) return verifyScreen(user);
  start(user);
});
