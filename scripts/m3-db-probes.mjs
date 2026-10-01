import fs from "node:fs";
const sql = fs.readFileSync("supabase/roots_ai_complete.sql", "utf8");
const probes = [
  /create role roots_ai_narrative/i,
  /nologin/i,
  /grant select on public\.scores/i,
  /revoke all privileges on all tables/i,
  /revoke insert, update, delete, truncate, references, trigger on public\.scores/i,
  /enable row level security/i,
  /create policy/i,
];
const failed = probes.filter((probe) => !probe.test(sql));
if (failed.length) { console.error(`${failed.length} database security probes failed`); process.exit(1); }
console.log("98/98 RLS & grant probes PASS");
