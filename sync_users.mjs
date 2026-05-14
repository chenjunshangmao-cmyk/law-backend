import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, "data", "users.json");
const PG_URL = "postgresql://claw_render:ClawRemote2026!@localhost:5432/claw";

const pool = new pg.Pool({
  connectionString: PG_URL,
  ssl: false,
  max: 5,
});

async function main() {
  // 从PG查所有用户
  const r = await pool.query(
    "SELECT id::text, email, name, role, membership_type as plan, password, created_at, updated_at FROM users ORDER BY created_at"
  );

  console.log(`PG查到 ${r.rows.length} 个用户:`);
  const users = r.rows.map((u, i) => ({
    id: u.id,
    email: u.email,
    name: u.name || "",
    role: u.role || "user",
    plan: u.plan || "free",
    hashedPassword: u.password,
    createdAt: u.created_at,
    updated_at: u.updated_at,
    member_id: `M${String(20260513)}${String(i + 1).padStart(4, "0")}`,
  }));

  // 写回JSON文件
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  console.log(`已同步 ${users.length} 个用户到 ${USERS_FILE}`);
  users.forEach((u) =>
    console.log(`  ${u.email.padEnd(20)} ${u.role.padEnd(8)} ${u.plan}`)
  );

  await pool.end();
}

main().catch(console.error);
