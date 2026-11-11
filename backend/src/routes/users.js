import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db/database.js";
import { requireAuth, requireAdmin, publicUser } from "../middleware/auth.js";
const router = Router();

router.get("/profiles", (req, res) => {
  const profiles = db
    .prepare(
      `SELECT id, display_name FROM users ORDER BY display_name COLLATE NOCASE`,
    )
    .all();
  res.json({ profiles });
});

router.use(requireAuth);
router.get("/", (req, res) => {
  if (req.user.role === "guest")
    return res.json({ users: [publicUser(req.user)] });
  const users = db
    .prepare(
      "SELECT id,display_name,role,birthday FROM users WHERE role IN ('admin','family') ORDER BY display_name",
    )
    .all();
  res.json({ users: users.map(publicUser) });
});
const schema = z.object({
  display_name: z.string().trim().min(1).max(70),
  email: z.string().email(),
  password: z.string().min(12).max(128),
  role: z.enum(["family", "guest"]),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});
router.post("/", requireAdmin, (req, res) => {
  const v = schema.safeParse(req.body);
  if (!v.success)
    return res
      .status(400)
      .json({ error: "Champs invalides", details: v.error.flatten() });
  const x = v.data;
  try {
    const info = db
      .prepare(
        "INSERT INTO users(display_name,email,password_hash,role,birthday) VALUES(?,?,?,?,?)",
      )
      .run(
        x.display_name,
        x.email.toLowerCase(),
        bcrypt.hashSync(x.password, 12),
        x.role,
        x.birthday ?? null,
      );
    res.status(201).json({
      user: publicUser(
        db.prepare("SELECT * FROM users WHERE id=?").get(info.lastInsertRowid),
      ),
    });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res.status(409).json({ error: "Email déjà utilisé" });
    throw e;
  }
});
export default router;
