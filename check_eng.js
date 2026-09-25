const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1]] = match[2].replace(/^['\"]/, "").replace(/['\"]$/, "");
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

(async () => {
  const subjectNames = [
    "English Studies",
    "English Language",
    "General Mathematics",
    "Mathematics",
    "Biology",
    "Chemistry",
    "Physics",
    "Economics",
    "Commerce",
  ];
  const { data: subjects, error: subErr } = await supabase
    .from("subjects")
    .select("id, name, is_active")
    .in("name", subjectNames);
  if (subErr) throw subErr;

  const subjectIds = (subjects || []).map((s) => s.id);
  const { data: questions, error: qErr } = subjectIds.length
    ? await supabase
        .from("questions")
        .select("id, subject_id, is_active, legacy_id")
        .in("subject_id", subjectIds)
    : { data: [], error: null };
  if (qErr) throw qErr;

  const counts = {};
  for (const q of questions || []) {
    if (q.is_active) counts[q.subject_id] = (counts[q.subject_id] || 0) + 1;
  }

  console.log(JSON.stringify({ subjects: subjects || [], counts }, null, 2));
})();
