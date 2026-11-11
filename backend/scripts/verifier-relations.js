import "dotenv/config";
import { db } from "../src/db/database.js";

try {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all();

  let relations = 0;

  for (const table of tables) {
    const foreignKeys = db.pragma(
      `foreign_key_list("${table.name.replaceAll('"', '""')}")`,
    );

    for (const key of foreignKeys) {
      if (key.table === "users") {
        console.log(`${table.name}.${key.from} -> users.${key.to}`);
        relations++;
      }
    }
  }

  if (relations === 0) {
    console.log("Aucune clé étrangère vers users trouvée.");
  }

  const objets = db
    .prepare(
      `
    SELECT type, name
    FROM sqlite_master
    WHERE type IN ('index', 'trigger')
      AND tbl_name = 'users'
  `,
    )
    .all();

  console.log("Index et déclencheurs :", objets);
} catch (error) {
  console.error("Erreur :", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
