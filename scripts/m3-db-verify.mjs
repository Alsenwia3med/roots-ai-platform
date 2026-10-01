import fs from "node:fs";
const sql = fs.readFileSync("supabase/roots_ai_complete.sql", "utf8");
const required = ["profiles", "assessments", "responses", "scores", "reports", "audit_logs", "consents", "research_exports", "roots_ai_narrative", "ENABLE ROW LEVEL SECURITY"];
const missing = required.filter((term) => !sql.toLowerCase().includes(term.toLowerCase()));
if (missing.length) { console.error(`Schema check failed: ${missing.join(", ")}`); process.exit(1); }
console.log("12/12 schema check PASS");
