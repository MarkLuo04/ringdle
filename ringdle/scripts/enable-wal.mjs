import { createClient } from "@libsql/client";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "../prisma/db.sqlite");

const db = createClient({ url: `file:${dbPath}` });
const result = await db.execute("PRAGMA journal_mode=WAL");
console.log("journal_mode:", result.rows[0]?.journal_mode ?? result.rows[0]);
db.close();
