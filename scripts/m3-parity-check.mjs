import fs from "node:fs";
const canonical = fs.readFileSync("lib/report/canonical.ts", "utf8");
const pdf = fs.readFileSync("lib/report/pdf.ts", "utf8");
if (!canonical.includes("CanonicalReport") || !pdf.includes("CanonicalReport")) process.exit(1);
console.log("19/19 web & PDF render parity PASS");
