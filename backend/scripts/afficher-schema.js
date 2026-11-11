import "dotenv/config";
import { db } from "../src/db/database.js";

try {
  const tables = db
    .prepare(
      `
    SELECT name, sql
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `,
    )
    .all();

  for (const table of tables) {
    console.log(`\n===== ${table.name} =====`);
    console.log(table.sql);
  }

  console.log(`\nNombre de tables : ${tables.length}`);
} catch (error) {
  console.error("Erreur :", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
