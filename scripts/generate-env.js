require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltam vars SUPABASE_URL ou SUPABASE_KEY.");
  process.exit(1);
}

const content = `const SUPABASE_URL = "${SUPABASE_URL}";
const SUPABASE_KEY = "${SUPABASE_KEY}";`;

fs.writeFileSync(path.join(__dirname, "..", "env.js"), content);
console.log("env.js gerado com sucesso");
