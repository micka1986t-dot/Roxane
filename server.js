// Mille Plumes : serveur API + site. Comptes par pseudo, données dans Postgres.
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === "production";
const SECRET = process.env.SESSION_SECRET || (PROD ? null : "dev-secret-not-for-prod");
if (!SECRET) { console.error("SESSION_SECRET manquant"); process.exit(1); }
const ADMINS = (process.env.ADMIN_PSEUDOS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});
const q = (text, params) => pool.query(text, params);

/* ---------- Règles ---------- */
const GENRES = ["Fantaisie","Fantastique","Romance","Aventure","Humour","Autobiographie","Mystère","Science-fiction","Poésie"];
const COLORS = ["#1D1A33","#3B1F5C","#0F4C5C","#1F6E43","#7A1E3A","#D3336A","#F28C38"];
const thisYear = () => new Date().getFullYear();
const ageOf = u => thisYear() - u.birth_year;
const isAdult = u => !!u && ageOf(u) >= 18;
// Bloque e-mails, numéros de téléphone et comptes de réseaux sociaux (protection des mineurs)
const personal = t => /[\w.+-]+@[\w-]+\.[\w.]+/.test(t) || /(\+33|0)[1-9]([\s.-]?\d{2}){4}/.test(t) || /(instagram|snap|insta|tiktok|whatsapp|discord)\s*[:@]/i.test(t);
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = msg => { throw new HttpError(400, msg); };

/* Limiteur simple en mémoire : n requêtes par fenêtre et par IP */
function limiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now(), key = req.ip;
    const e = hits.get(key) || { n: 0, t: now };
    if (now - e.t > windowMs) { e.n = 0; e.t = now; }
    e.n++; hits.set(key, e);
    if (hits.size > 5000) hits.clear();
    if (e.n > max) return res.status(429).json({ error: "Trop d'essais. Réessaie dans quelques minutes." });
    next();
  };
}

/* ---------- Application ---------- */
const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "300kb" }));
app.use(cookieParser());
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Session : JWT signé dans un cookie httpOnly
const COOKIE = "pl_session";
function setSession(res, user) {
  const token = jwt.sign({ uid: user.id }, SECRET, { expiresIn: "60d" });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: PROD, maxAge: 60 * 24 * 3600 * 1000 });
}
app.use(wrap(async (req, res, next) => {
  req.user = null;
  const t = req.cookies[COOKIE];
  if (t) {
    try {
      const { uid } = jwt.verify(t, SECRET);
      const r = await q("SELECT * FROM users WHERE id=$1", [uid]);
      req.user = r.rows[0] || null;
    } catch { res.clearCookie(COOKIE); }
  }
  next();
}));
const needUser = (req, res, next) => req.user ? next() : res.status(401).json({ error: "Connecte-toi d'abord." });
const needAdmin = (req, res, next) => req.user?.is_admin ? next() : res.status(403).json({ error: "Réservé à la modération." });

const publicMe = u => u && ({ id: u.id, pseudo: u.pseudo, bio: u.bio, color: u.color, adult: isAdult(u), premium: u.premium, isAdmin: u.is_admin });

/* ----- Comptes ----- */
const authLimit = limiter(20, 15 * 60 * 1000);
app.post("/api/signup", authLimit, wrap(async (req, res) => {
  const pseudo = str(req.body.pseudo, 24), password = String(req.body.password || "");
  const birthYear = parseInt(req.body.birthYear, 10);
  if (pseudo.length < 3) bad("Ton pseudo doit faire au moins 3 caractères.");
  if (!/^[\p{L}\p{N}_.-]+$/u.test(pseudo)) bad("Pseudo : seulement des lettres, des chiffres, _ . ou - (pas d'espace).");
  if (personal(pseudo)) bad("Ce pseudo ressemble à une info personnelle.");
  if (password.length < 8) bad("Le mot de passe doit faire au moins 8 caractères.");
  if (!(birthYear >= thisYear() - 100 && birthYear <= thisYear() - 10)) bad("Il faut avoir au moins 10 ans pour s'inscrire.");
  const age = thisYear() - birthYear;
  if (age < 15 && req.body.parentOk !== true) bad("Avant 15 ans, un parent doit être d'accord. Coche la case avec lui ou elle.");
  const hash = await bcrypt.hash(password, 10);
  const color = COLORS[crypto.randomInt(COLORS.length)];
  const admin = ADMINS.includes(pseudo.toLowerCase());
  try {
    const r = await q(`INSERT INTO users (pseudo,password_hash,birth_year,color,parent_consent,is_admin) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [pseudo, hash, birthYear, color, age < 15, admin]);
    setSession(res, r.rows[0]);
    res.json({ me: publicMe(r.rows[0]) });
  } catch (e) {
    if (e.code === "23505") bad("Ce pseudo est déjà pris. Essaie une variante.");
    throw e;
  }
}));
app.post("/api/login", authLimit, wrap(async (req, res) => {
  const r = await q("SELECT * FROM users WHERE lower(pseudo)=lower($1) AND NOT is_demo", [str(req.body.pseudo, 24)]);
  const u = r.rows[0];
  if (!u || !(await bcrypt.compare(String(req.body.password || ""), u.password_hash))) bad("Pseudo ou mot de passe incorrect.");
  if (ADMINS.includes(u.pseudo.toLowerCase()) && !u.is_admin) { await q("UPDATE users SET is_admin=true WHERE id=$1", [u.id]); u.is_admin = true; }
  setSession(res, u);
  res.json({ me: publicMe(u) });
}));
app.post("/api/logout", (req, res) => { res.clearCookie(COOKIE); res.json({ ok: true }); });
app.get("/api/me", (req, res) => res.json({ me: publicMe(req.user) }));
app.patch("/api/me", needUser, wrap(async (req, res) => {
  const bio = str(req.body.bio, 300);
  if (personal(bio)) bad("Retire l'e-mail, le numéro ou le compte de réseau social de ta bio.");
  const r = await q("UPDATE users SET bio=$1 WHERE id=$2 RETURNING *", [bio, req.user.id]);
  res.json({ me: publicMe(r.rows[0]) });
}));
app.delete("/api/me", needUser, wrap(async (req, res) => {
  await q("DELETE FROM users WHERE id=$1", [req.user.id]);
  res.clearCookie(COOKIE); res.json({ ok: true });
}));
app.post("/api/premium", needUser, wrap(async (req, res) => {
  // Démo : bascule Premium sans paiement
  const r = await q("UPDATE users SET premium = NOT premium WHERE id=$1 RETURNING *", [req.user.id]);
  res.json({ me: publicMe(r.rows[0]) });
}));

/* ----- Histoires ----- */
const STORY_COLS = `s.id, s.title, s.summary, s.section, s.genre, s.kind AS type, s.cover, s.reads, s.created_at,
  u.pseudo AS author, u.color AS author_color,
  (SELECT count(*)::int FROM chapters c WHERE c.story_id=s.id) AS chapter_count,
  (SELECT count(*)::int FROM reviews r WHERE r.story_id=s.id AND NOT r.hidden) AS review_count,
  (SELECT coalesce(avg(stars),0)::float FROM reviews r WHERE r.story_id=s.id AND NOT r.hidden) AS avg`;

app.get("/api/stories", wrap(async (req, res) => {
  const section = req.query.section === "adulte" ? "adulte" : "jeunesse";
  if (section === "adulte" && !isAdult(req.user)) return res.status(403).json({ error: "adult_only" });
  const p = [section], where = ["s.section=$1", "NOT s.hidden"];
  if (GENRES.includes(req.query.genre)) { p.push(req.query.genre); where.push(`s.genre=$${p.length}`); }
  if (["courte", "chapitres"].includes(req.query.type)) { p.push(req.query.type); where.push(`s.kind=$${p.length}`); }
  const search = str(req.query.q, 60);
  if (search) { p.push(`%${search}%`); where.push(`(s.title ILIKE $${p.length} OR u.pseudo ILIKE $${p.length} OR s.summary ILIKE $${p.length})`); }
  const order = { note: "avg DESC, review_count DESC", lus: "s.reads DESC" }[req.query.sort] || "s.created_at DESC";
  const r = await q(`SELECT ${STORY_COLS} FROM stories s JOIN users u ON u.id=s.author_id WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT 60`, p);
  res.json({ stories: r.rows });
}));

app.get("/api/stories/:id", wrap(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const r = await q(`SELECT ${STORY_COLS}, s.author_id FROM stories s JOIN users u ON u.id=s.author_id WHERE s.id=$1 AND (NOT s.hidden OR s.author_id=$2)`, [id, req.user?.id || 0]);
  const s = r.rows[0];
  if (!s) return res.status(404).json({ error: "Cette histoire n'existe pas (ou plus)." });
  if (s.section === "adulte" && !isAdult(req.user)) return res.status(403).json({ error: "adult_only" });
  const [ch, rv, fo] = await Promise.all([
    q("SELECT title, body FROM chapters WHERE story_id=$1 ORDER BY position", [id]),
    q(`SELECT r.id, r.stars, r.body, r.created_at, CASE WHEN r.anonymous THEN 'Anonyme' ELSE u.pseudo END AS who, r.user_id=$2 AS mine
       FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.story_id=$1 AND NOT r.hidden ORDER BY r.created_at DESC`, [id, req.user?.id || 0]),
    req.user ? q("SELECT 1 FROM follows WHERE follower_id=$1 AND author_id=$2", [req.user.id, s.author_id]) : { rows: [] },
  ]);
  s.chapters = ch.rows; s.reviews = rv.rows; s.following = fo.rows.length > 0;
  s.mine = req.user?.id === s.author_id; delete s.author_id;
  res.json({ story: s });
}));

app.post("/api/stories/:id/read", wrap(async (req, res) => {
  await q("UPDATE stories SET reads=reads+1 WHERE id=$1", [parseInt(req.params.id, 10)]);
  res.json({ ok: true });
}));

const writeLimit = limiter(60, 10 * 60 * 1000);
function cleanCover(c) {
  const hex = v => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  c = c || {};
  return {
    bg: hex(c.bg) || "#3B1F5C", bg2: hex(c.bg2) || "#D3336A", shapeColor: hex(c.shapeColor) || "#F2C94C", text: hex(c.text) || "#FFFFFF",
    pattern: pick(c.pattern, ["none", "gradient", "dots", "stripes", "stars", "waves"], "gradient"),
    shape: pick(c.shape, ["none", "circle", "arch", "diamond", "mountain", "heart"], "circle"),
    font: pick(c.font, ["display", "script", "hand", "royal", "typewriter", "bold"], "display"),
    ai: c.ai === true,
  };
}
app.post("/api/stories", needUser, writeLimit, wrap(async (req, res) => {
  const b = req.body, title = str(b.title, 70), summary = str(b.summary, 300);
  const section = b.section === "adulte" ? "adulte" : "jeunesse";
  const type = b.type === "chapitres" ? "chapitres" : "courte";
  if (!title) bad("Il manque un titre.");
  if (section === "adulte" && !isAdult(req.user)) bad("La section Adulte est réservée aux 18 ans et plus.");
  if (!GENRES.includes(b.genre)) bad("Choisis un genre.");
  const chapters = (Array.isArray(b.chapters) ? b.chapters : []).slice(0, 100).map((c, i) => ({ title: str(c.title, 80), body: str(c.body, 60000), i }));
  if (!chapters.length || (type === "courte" && chapters.length !== 1)) bad("Le texte est vide.");
  if (chapters.some(c => c.body.split(/\s+/).length < 20)) bad("Chaque partie doit faire au moins 20 mots.");
  if (personal(title + " " + summary + " " + chapters.map(c => c.body).join(" "))) bad("Ton texte contient un e-mail, un numéro ou un compte de réseau social. Retire-le pour rester anonyme.");
  const cover = cleanCover(b.cover);
  if (cover.ai && !req.user.premium) cover.ai = false;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const s = await client.query(`INSERT INTO stories (author_id,title,summary,section,genre,kind,cover) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [req.user.id, title, summary || "Une nouvelle histoire.", section, b.genre, type, cover]);
    for (const c of chapters)
      await client.query("INSERT INTO chapters (story_id,position,title,body) VALUES ($1,$2,$3,$4)",
        [s.rows[0].id, c.i, c.title || (type === "courte" ? "Histoire courte" : "Chapitre " + (c.i + 1)), c.body]);
    await client.query("COMMIT");
    res.json({ id: s.rows[0].id });
  } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
}));
app.delete("/api/stories/:id", needUser, wrap(async (req, res) => {
  const r = await q("DELETE FROM stories WHERE id=$1 AND author_id=$2", [parseInt(req.params.id, 10), req.user.id]);
  if (!r.rowCount) throw new HttpError(404, "Histoire introuvable.");
  res.json({ ok: true });
}));

app.post("/api/stories/:id/reviews", needUser, writeLimit, wrap(async (req, res) => {
  const id = parseInt(req.params.id, 10), stars = parseInt(req.body.stars, 10), body = str(req.body.body, 400);
  if (!(stars >= 1 && stars <= 5)) bad("Choisis une note de 1 à 5 étoiles.");
  if (body.length < 5) bad("Écris au moins quelques mots pour expliquer ta note.");
  if (personal(body)) bad("Pour ta sécurité, ne mets pas d'e-mail, de numéro ou de compte de réseau social dans ton avis.");
  const s = await q("SELECT author_id, section FROM stories WHERE id=$1 AND NOT hidden", [id]);
  if (!s.rows[0]) throw new HttpError(404, "Histoire introuvable.");
  if (s.rows[0].author_id === req.user.id) bad("Tu ne peux pas noter ta propre histoire.");
  if (s.rows[0].section === "adulte" && !isAdult(req.user)) throw new HttpError(403, "adult_only");
  await q(`INSERT INTO reviews (story_id,user_id,anonymous,stars,body) VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (story_id,user_id) DO UPDATE SET stars=EXCLUDED.stars, body=EXCLUDED.body, anonymous=EXCLUDED.anonymous, created_at=now(), hidden=false`,
    [id, req.user.id, req.body.anonymous !== false, stars, body]);
  res.json({ ok: true });
}));

/* ----- Auteurs, abonnements, blog ----- */
app.get("/api/authors/:pseudo", wrap(async (req, res) => {
  const r = await q("SELECT id, pseudo, bio, color FROM users WHERE lower(pseudo)=lower($1)", [req.params.pseudo]);
  const a = r.rows[0];
  if (!a) return res.status(404).json({ error: "Cet auteur n'existe pas." });
  const sections = isAdult(req.user) ? ["jeunesse", "adulte"] : ["jeunesse"];
  const [st, po, fc, fo] = await Promise.all([
    q(`SELECT ${STORY_COLS} FROM stories s JOIN users u ON u.id=s.author_id WHERE s.author_id=$1 AND NOT s.hidden AND s.section = ANY($2) ORDER BY s.created_at DESC`, [a.id, sections]),
    q("SELECT body, created_at FROM posts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30", [a.id]),
    q("SELECT count(*)::int AS n FROM follows WHERE author_id=$1", [a.id]),
    req.user ? q("SELECT 1 FROM follows WHERE follower_id=$1 AND author_id=$2", [req.user.id, a.id]) : { rows: [] },
  ]);
  res.json({ author: { pseudo: a.pseudo, bio: a.bio, color: a.color, followers: fc.rows[0].n, following: fo.rows.length > 0, isMe: req.user?.id === a.id, stories: st.rows, posts: po.rows } });
}));
app.post("/api/authors/:pseudo/follow", needUser, wrap(async (req, res) => {
  const r = await q("SELECT id FROM users WHERE lower(pseudo)=lower($1)", [req.params.pseudo]);
  const a = r.rows[0];
  if (!a) throw new HttpError(404, "Auteur introuvable.");
  if (a.id === req.user.id) bad("Tu ne peux pas te suivre toi-même.");
  const del = await q("DELETE FROM follows WHERE follower_id=$1 AND author_id=$2", [req.user.id, a.id]);
  if (!del.rowCount) await q("INSERT INTO follows (follower_id, author_id) VALUES ($1,$2)", [req.user.id, a.id]);
  res.json({ following: !del.rowCount });
}));
app.post("/api/posts", needUser, writeLimit, wrap(async (req, res) => {
  const body = str(req.body.body, 280);
  if (body.length < 3) bad("Écris quelque chose avant de publier.");
  if (personal(body)) bad("Pas d'infos personnelles dans les annonces.");
  await q("INSERT INTO posts (user_id, body) VALUES ($1,$2)", [req.user.id, body]);
  res.json({ ok: true });
}));
app.get("/api/space", needUser, wrap(async (req, res) => {
  const [mine, posts, follows, feed] = await Promise.all([
    q(`SELECT ${STORY_COLS} FROM stories s JOIN users u ON u.id=s.author_id WHERE s.author_id=$1 ORDER BY s.created_at DESC`, [req.user.id]),
    q("SELECT body, created_at FROM posts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30", [req.user.id]),
    q("SELECT u.pseudo FROM follows f JOIN users u ON u.id=f.author_id WHERE f.follower_id=$1 ORDER BY u.pseudo", [req.user.id]),
    q(`SELECT p.body, p.created_at, u.pseudo FROM posts p JOIN follows f ON f.author_id=p.user_id JOIN users u ON u.id=p.user_id
       WHERE f.follower_id=$1 ORDER BY p.created_at DESC LIMIT 30`, [req.user.id]),
  ]);
  res.json({ stories: mine.rows, posts: posts.rows, follows: follows.rows.map(r => r.pseudo), feed: feed.rows });
}));

/* ----- Signalements et modération ----- */
app.post("/api/reports", limiter(20, 10 * 60 * 1000), wrap(async (req, res) => {
  const type = req.body.targetType === "review" ? "review" : "story";
  const id = parseInt(req.body.targetId, 10);
  if (!id) bad("Signalement incomplet.");
  await q("INSERT INTO reports (target_type,target_id,reason,reporter_id) VALUES ($1,$2,$3,$4)", [type, id, str(req.body.reason, 120) || "Autre", req.user?.id || null]);
  res.json({ ok: true });
}));
app.get("/api/admin/reports", needUser, needAdmin, wrap(async (req, res) => {
  const r = await q(`SELECT rp.*, CASE WHEN rp.target_type='story' THEN (SELECT title FROM stories WHERE id=rp.target_id)
    ELSE (SELECT body FROM reviews WHERE id=rp.target_id) END AS excerpt,
    CASE WHEN rp.target_type='story' THEN (SELECT hidden FROM stories WHERE id=rp.target_id) ELSE (SELECT hidden FROM reviews WHERE id=rp.target_id) END AS hidden,
    CASE WHEN rp.target_type='story' THEN rp.target_id ELSE (SELECT story_id FROM reviews WHERE id=rp.target_id) END AS story_id
    FROM reports rp WHERE status='open' ORDER BY created_at DESC LIMIT 100`);
  res.json({ reports: r.rows });
}));
app.post("/api/admin/reports/:id", needUser, needAdmin, wrap(async (req, res) => {
  const r = await q("SELECT * FROM reports WHERE id=$1", [parseInt(req.params.id, 10)]);
  const rp = r.rows[0];
  if (!rp) throw new HttpError(404, "Signalement introuvable.");
  if (req.body.action === "hide") await q(`UPDATE ${rp.target_type === "story" ? "stories" : "reviews"} SET hidden=true WHERE id=$1`, [rp.target_id]);
  await q("UPDATE reports SET status='done' WHERE target_type=$1 AND target_id=$2", [rp.target_type, rp.target_id]);
  res.json({ ok: true });
}));

app.get("/healthz", wrap(async (req, res) => { await q("SELECT 1"); res.send("ok"); }));
app.use("/api", (req, res) => res.status(404).json({ error: "Introuvable." }));

/* ----- Site ----- */
app.use(express.static(path.join(__dirname, "public"), { setHeaders: r => r.setHeader("Cache-Control", "no-cache") }));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Ton texte est trop long pour être envoyé d'un coup." });
  console.error(err);
  res.status(500).json({ error: "Une erreur est survenue. Réessaie dans un instant." });
});

/* ---------- Démarrage : schéma + histoires d'exemple si la base est vide ---------- */
async function init() {
  await q(fs.readFileSync(path.join(__dirname, "db", "schema.sql"), "utf8"));
  const n = await q("SELECT count(*)::int AS n FROM stories");
  if (n.rows[0].n === 0 && process.env.SEED_DEMO !== "false") {
    const { AUTHORS, SEED } = require("./db/seed-data.js");
    const ids = {};
    for (const [pseudo, a] of Object.entries(AUTHORS)) {
      // Comptes d'exemple : mot de passe aléatoire, connexion impossible (is_demo)
      const r = await q(`INSERT INTO users (pseudo,password_hash,bio,color,birth_year,is_demo) VALUES ($1,$2,$3,$4,1990,true)
        ON CONFLICT ((lower(pseudo))) DO UPDATE SET bio=EXCLUDED.bio RETURNING id`, [pseudo, crypto.randomBytes(24).toString("hex"), a.bio, a.color]);
      ids[pseudo] = r.rows[0].id;
      for (const p of a.posts) await q("INSERT INTO posts (user_id, body, created_at) VALUES ($1,$2,$3)", [ids[pseudo], p.t, p.d + "T12:00:00Z"]);
    }
    const reviewers = {};
    const reviewer = async who => {
      if (reviewers[who]) return reviewers[who];
      const r = await q(`INSERT INTO users (pseudo,password_hash,birth_year,is_demo) VALUES ($1,$2,2011,true) ON CONFLICT ((lower(pseudo))) DO UPDATE SET is_demo=true RETURNING id`,
        [who, crypto.randomBytes(24).toString("hex")]);
      return (reviewers[who] = r.rows[0].id);
    };
    let anon = 0;
    for (const s of SEED) {
      const r = await q(`INSERT INTO stories (author_id,title,summary,section,genre,kind,cover,reads,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [ids[s.author], s.title, s.summary, s.section, s.genre, s.type, s.cover, s.reads, s.date + "T12:00:00Z"]);
      const sid = r.rows[0].id;
      for (const [i, c] of s.chapters.entries()) await q("INSERT INTO chapters (story_id,position,title,body) VALUES ($1,$2,$3,$4)", [sid, i, c.t, c.p.join("\n\n")]);
      for (const v of s.reviews) {
        const isAnon = v.who === "Anonyme";
        const uid = await reviewer(isAnon ? "Lecteur_exemple_" + ++anon : v.who);
        await q("INSERT INTO reviews (story_id,user_id,anonymous,stars,body,created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING", [sid, uid, isAnon, v.s, v.t, v.d + "T12:00:00Z"]);
      }
    }
    console.log("Histoires d'exemple ajoutées.");
  }
}
if (require.main === module) {
  init().then(() => app.listen(PORT, () => console.log("Mille Plumes sur le port " + PORT)))
    .catch(e => { console.error("Démarrage impossible :", e); process.exit(1); });
}
module.exports = { app, init, pool };
