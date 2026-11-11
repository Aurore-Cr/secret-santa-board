import "dotenv/config";
import { db } from "../src/db/database.js";

try {
  const schema = db
    .prepare(
      `
    SELECT sql FROM sqlite_master
    WHERE type = 'table' AND name = 'users'
  `,
    )
    .get()?.sql;

  if (!schema) {
    throw new Error("Table users introuvable.");
  }

  if (/['"]child['"]/.test(schema)) {
    console.log("Le rôle child est déjà autorisé.");
  } else {
    const updatedSchema = schema.replace(
      /CHECK\s*\(\s*role\s+IN\s*\(\s*'admin'\s*,\s*'adult'\s*,\s*'child'\s*\)\s*\)/i,
      "CHECK(role IN ('admin','adult','child'))",
    );

    if (updatedSchema === schema) {
      throw new Error("Contrainte inattendue : migration annulée.");
    }

    db.transaction(() => {
      db.exec(
        updatedSchema.replace(
          /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?users\b/i,
          "CREATE TABLE users_new",
        ),
      );

      db.exec(`
        INSERT INTO users_new
        (id, display_name, email, password_hash, role, birthday, created_at)
        SELECT id, display_name, email, password_hash, role, birthday, created_at
        FROM users
      `);

      db.exec("DROP TABLE users");
      db.exec("ALTER TABLE users_new RENAME TO users");
    })();

    console.log("Rôle child ajouté avec succès.");
  }
} catch (error) {
  console.error("Migration échouée :", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
