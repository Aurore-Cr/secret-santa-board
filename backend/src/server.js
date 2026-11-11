import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { pool, query, initSchema } from "./db.js";
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
  throw Error("SESSION_SECRET doit contenir au moins 32 caractères");
await initSchema();
const app = express();
const production = process.env.NODE_ENV === "production";

if (production) app.set("trust proxy", 1);
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "data:", "blob:"],
      },
    },
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.get("origin");
    const expected =
      process.env.FRONTEND_ORIGIN ||
      (production
        ? `${req.protocol}://${req.get("host")}`
        : "http://localhost:5173");
    if (origin !== expected)
      return res.status(403).json({ error: "Origine refusée" });
  }
  next();
});
const PgStore = connectPgSimple(session);
app.use(
  session({
    name: "noel.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PgStore({
      pool,
      createTableIfMissing: true,
      tableName: "user_sessions",
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: production,
      maxAge: 7 * 24 * 3600 * 1000,
    },
  }),
);
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const userPublic = (u) => ({
  id: u.id,
  name: u.display_name,
  role: u.role,
  activated: !!u.password_hash,
});
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const one = async (sql, params = []) => (await query(sql, params)).rows[0];
const many = async (sql, params = []) => (await query(sql, params)).rows;
const requireUser = wrap(async (req, res, next) => {
  req.user = req.session.userId
    ? await one("SELECT * FROM users WHERE id=$1", [req.session.userId])
    : null;
  if (!req.user) return res.status(401).json({ error: "Connexion requise" });
  next();
});
const adultsOnly = (req, res, next) =>
  req.user.role === "child"
    ? res.status(403).json({ error: "Accès réservé aux adultes" })
    : next();
const parse = (schema, body, res) => {
  const r = schema.safeParse(body);
  if (!r.success) {
    res.status(400).json({ error: "Données invalides" });
    return null;
  }
  return r.data;
};
const credentials = z.object({
  name: z.string().trim().min(1).max(70),
  password: z.string().min(12).max(128),
});
const dummy = "$2a$12$KIXQ4w2L8oVZrJ9JdFfNZeAnk6g5xJ7jXDBL9b6C7kA2i0l12JmD6";
app.get(
  "/api/health",
  wrap(async (req, res) => {
    await query("SELECT 1");
    res.json({ ok: true });
  }),
);
const profiles = wrap(async (req, res) =>
  res.json({
    profiles: (
      await many(
        "SELECT id,display_name,role,password_hash FROM users ORDER BY id",
      )
    ).map(userPublic),
  }),
);
app.get("/api/auth/profiles", profiles);
app.get("/api/users/profiles", profiles);
const loginSession = (req, res, next, user) =>
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.userId = user.id;
    req.session.save((e) =>
      e ? next(e) : res.json({ user: userPublic(user) }),
    );
  });
app.post(
  "/api/auth/activate",
  authLimit,
  wrap(async (req, res, next) => {
    const d = parse(
      z.object({
        name: z.string().trim().min(1).max(70),
        code: z.string().min(20),
        password: z.string().min(12).max(128),
      }),
      req.body,
      res,
    );
    if (!d) return;
    const u = await one("SELECT * FROM users WHERE display_name=$1", [d.name]);
    if (
      !u ||
      u.password_hash ||
      !bcrypt.compareSync(d.code, u.activation_hash || dummy)
    )
      return res.status(400).json({
        error: "Activation impossible : vérifier le profil et le code",
      });
    const hash = bcrypt.hashSync(d.password, 12);
    const updated = await one(
      "UPDATE users SET password_hash=$1,activation_hash=NULL,activated_at=CURRENT_TIMESTAMP WHERE id=$2 AND password_hash IS NULL RETURNING *",
      [hash, u.id],
    );
    if (!updated) return res.status(409).json({ error: "Profil déjà activé" });
    loginSession(req, res, next, updated);
  }),
);
app.post(
  "/api/auth/login",
  authLimit,
  wrap(async (req, res, next) => {
    const d = parse(credentials, req.body, res);
    if (!d) return;
    const u = await one("SELECT * FROM users WHERE display_name=$1", [d.name]);
    if (!u || !bcrypt.compareSync(d.password, u.password_hash || dummy))
      return res.status(401).json({ error: "Identifiants incorrects" });
    loginSession(req, res, next, u);
  }),
);
app.get("/api/auth/me", requireUser, (req, res) =>
  res.json({ user: userPublic(req.user) }),
);
app.post("/api/auth/logout", requireUser, (req, res, next) =>
  req.session.destroy((e) =>
    e ? next(e) : (res.clearCookie("noel.sid"), res.json({ ok: true })),
  ),
);
app.post(
  "/api/auth/password",
  requireUser,
  authLimit,
  wrap(async (req, res) => {
    const d = parse(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(12).max(128),
      }),
      req.body,
      res,
    );
    if (!d) return;
    if (!bcrypt.compareSync(d.currentPassword, req.user.password_hash || dummy))
      return res.status(403).json({ error: "Mot de passe actuel incorrect" });
    await query("UPDATE users SET password_hash=$1 WHERE id=$2", [
      bcrypt.hashSync(d.newPassword, 12),
      req.user.id,
    ]);
    res.json({ ok: true });
  }),
);
app.get(
  "/api/events",
  requireUser,
  wrap(async (req, res) =>
    res.json({
      events: await many(
        "SELECT id,title,event_date FROM events ORDER BY id DESC",
      ),
    }),
  ),
);
app.get(
  "/api/wishes/mine",
  requireUser,
  wrap(async (req, res) =>
    res.json({
      wishes: await many(
        "SELECT id,event_id,title,description,price_cents,CASE WHEN image_data IS NOT NULL THEN 1 ELSE 0 END AS has_image FROM wishes WHERE owner_id=$1 ORDER BY id DESC",
        [req.user.id],
      ),
    }),
  ),
);
app.post(
  "/api/wishes",
  requireUser,
  wrap(async (req, res) => {
    const d = parse(
      z.object({
        eventId: z.number().int().positive(),
        title: z.string().trim().min(1).max(150),
        description: z.string().max(2000).default(""),
        priceCents: z.number().int().nonnegative().nullable().default(null),
      }),
      req.body,
      res,
    );
    if (!d) return;
    if (!(await one("SELECT 1 FROM events WHERE id=$1", [d.eventId])))
      return res.status(404).json({ error: "Événement inconnu" });
    const w = await one(
      "INSERT INTO wishes(owner_id,event_id,title,description,price_cents) VALUES($1,$2,$3,$4,$5) RETURNING id",
      [req.user.id, d.eventId, d.title, d.description, d.priceCents],
    );
    res.status(201).json({ id: w.id });
  }),
);
const photoParser = express.raw({
  type: ["image/jpeg", "image/png", "image/webp"],
  limit: "2mb",
});
function validImage(b, m) {
  if (!Buffer.isBuffer(b) || !b.length) return false;
  const jpeg = b.length > 3 && b[0] === 255 && b[1] === 216 && b[2] === 255;
  const png =
    b.length > 8 &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp =
    b.length > 12 &&
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP";
  return (
    (jpeg && m === "image/jpeg") ||
    (png && m === "image/png") ||
    (webp && m === "image/webp")
  );
}
app.put(
  "/api/wishes/:id/photo",
  requireUser,
  photoParser,
  wrap(async (req, res) => {
    const w = await one("SELECT owner_id FROM wishes WHERE id=$1", [
      req.params.id,
    ]);
    if (!w || w.owner_id !== req.user.id)
      return res.status(404).json({ error: "Souhait introuvable" });
    const mime = req.get("content-type")?.split(";")[0]?.trim();
    if (!validImage(req.body, mime))
      return res
        .status(400)
        .json({ error: "Photo invalide : JPEG, PNG ou WebP, 2 Mo maximum" });
    await query("UPDATE wishes SET image_data=$1,image_mime=$2 WHERE id=$3", [
      req.body,
      mime,
      req.params.id,
    ]);
    res.json({ ok: true });
  }),
);
app.delete(
  "/api/wishes/:id/photo",
  requireUser,
  wrap(async (req, res) => {
    const r = await query(
      "UPDATE wishes SET image_data=NULL,image_mime=NULL WHERE id=$1 AND owner_id=$2",
      [req.params.id, req.user.id],
    );
    res
      .status(r.rowCount ? 200 : 404)
      .json(r.rowCount ? { ok: true } : { error: "Souhait introuvable" });
  }),
);
app.get(
  "/api/wishes/:id/photo",
  requireUser,
  wrap(async (req, res) => {
    const w = await one(
      "SELECT owner_id,image_data,image_mime FROM wishes WHERE id=$1",
      [req.params.id],
    );
    if (!w || !w.image_data)
      return res.status(404).json({ error: "Photo introuvable" });
    if (w.owner_id !== req.user.id && req.user.role === "child")
      return res.status(403).json({ error: "Accès refusé" });
    res.set("Content-Type", w.image_mime);
    res.set("Cache-Control", "private, no-store");
    res.set("X-Content-Type-Options", "nosniff");
    res.send(w.image_data);
  }),
);
app.delete(
  "/api/wishes/:id",
  requireUser,
  wrap(async (req, res) => {
    const r = await query("DELETE FROM wishes WHERE id=$1 AND owner_id=$2", [
      req.params.id,
      req.user.id,
    ]);
    res
      .status(r.rowCount ? 200 : 404)
      .json(r.rowCount ? { ok: true } : { error: "Souhait introuvable" });
  }),
);
app.get(
  "/api/family",
  requireUser,
  adultsOnly,
  wrap(async (req, res) =>
    res.json({
      members: await many(
        "SELECT id,display_name,role FROM users WHERE id<>$1 AND role<>'child' ORDER BY display_name",
        [req.user.id],
      ),
    }),
  ),
);
app.get(
  "/api/family/all",
  requireUser,
  adultsOnly,
  wrap(async (req, res) =>
    res.json({
      members: await many(
        "SELECT id,display_name,role FROM users WHERE id<>$1 ORDER BY display_name",
        [req.user.id],
      ),
    }),
  ),
);
app.get(
  "/api/family/:ownerId/wishes",
  requireUser,
  adultsOnly,
  wrap(async (req, res) => {
    const owner = await one("SELECT id,role FROM users WHERE id=$1", [
      req.params.ownerId,
    ]);
    if (!owner || owner.id === req.user.id)
      return res.status(403).json({ error: "Accès refusé à cette liste" });
    const wishes = await many(
      `SELECT w.id,w.title,w.description,w.price_cents,CASE WHEN w.image_data IS NOT NULL THEN 1 ELSE 0 END AS has_image,r.status,CASE WHEN r.buyer_id=$1 THEN 1 ELSE 0 END AS reserved_by_me FROM wishes w LEFT JOIN reservations r ON r.wish_id=w.id WHERE w.owner_id=$2 ORDER BY w.id DESC`,
      [req.user.id, owner.id],
    );
    res.json({ wishes });
  }),
);
app.post(
  "/api/reservations",
  requireUser,
  adultsOnly,
  wrap(async (req, res) => {
    const d = parse(
      z.object({ wishId: z.number().int().positive() }),
      req.body,
      res,
    );
    if (!d) return;
    const w = await one("SELECT owner_id FROM wishes WHERE id=$1", [d.wishId]);
    if (!w || w.owner_id === req.user.id)
      return res.status(403).json({ error: "Réservation impossible" });
    try {
      await query(
        "INSERT INTO reservations(wish_id,buyer_id,status) VALUES($1,$2,'reserved')",
        [d.wishId, req.user.id],
      );
      res.status(201).json({ ok: true });
    } catch (e) {
      if (e.code === "23505")
        return res.status(409).json({ error: "Déjà réservé" });
      throw e;
    }
  }),
);
app.patch(
  "/api/reservations/:wishId",
  requireUser,
  adultsOnly,
  wrap(async (req, res) => {
    const d = parse(
      z.object({ status: z.enum(["reserved", "purchased"]) }),
      req.body,
      res,
    );
    if (!d) return;
    const r = await query(
      "UPDATE reservations SET status=$1 WHERE wish_id=$2 AND buyer_id=$3",
      [d.status, req.params.wishId, req.user.id],
    );
    res
      .status(r.rowCount ? 200 : 404)
      .json(r.rowCount ? { ok: true } : { error: "Réservation introuvable" });
  }),
);
app.delete(
  "/api/reservations/:wishId",
  requireUser,
  adultsOnly,
  wrap(async (req, res) => {
    const r = await query(
      "DELETE FROM reservations WHERE wish_id=$1 AND buyer_id=$2",
      [req.params.wishId, req.user.id],
    );
    res
      .status(r.rowCount ? 200 : 404)
      .json(r.rowCount ? { ok: true } : { error: "Réservation introuvable" });
  }),
);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Route API introuvable" }),
);
const dist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/dist",
);
if (fs.existsSync(path.join(dist, "index.html"))) {
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status === 413 ? 413 : 500).json({
    error:
      err.status === 413
        ? "Photo trop volumineuse (2 Mo maximum)"
        : "Erreur serveur",
  });
});
const port = Number(process.env.PORT || 3001);
app.listen(port, "0.0.0.0", () =>
  console.log(`Serveur démarré sur le port ${port}`),
);
