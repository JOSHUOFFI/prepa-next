const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]/, "").replace(/['"]$/, "");
}
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
(async () => {
  const { data: subject, error: sErr } = await supabase
    .from("subjects")
    .select("id,name,slug,category,is_active")
    .eq("name", "Business Studies")
    .maybeSingle();
  console.log(JSON.stringify({ subject, sErr }, null, 2));
  if (subject) {
    const { data: topics, error: tErr } = await supabase
      .from("topics")
      .select("id,name,is_active")
      .eq("subject_id", subject.id)
      .order("name");
    console.log(JSON.stringify({ topics, tErr }, null, 2));
  }
})();
