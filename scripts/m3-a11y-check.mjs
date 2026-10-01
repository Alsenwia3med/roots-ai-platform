import fs from "node:fs";
const css = fs.readFileSync("app/globals.css", "utf8");
const screen = fs.readFileSync("components/pub-01/GoldenScreen.tsx", "utf8");
const checks = ["--zd-teal-ink", "--zd-gold-ink", "--zd-focus-ring", "overflow-x: hidden", "Driver", "Protective factor", "Not available"];
const missing = checks.filter((check) => !css.includes(check) && !screen.includes(check));
if (!css.includes("#437971") || !css.includes("#886b2e") || !css.includes("#2563eb")) { console.error("contrast token values missing"); process.exit(1); }
if (missing.length) { console.error(`a11y clauses missing: ${missing.join(", ")}`); process.exit(1); }
console.log("Accessibility static clauses PASS");
