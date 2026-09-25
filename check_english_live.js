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
  const [subjectsRes, catalogueRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, slug, category, is_active")
      .order("name", { ascending: true }),
    supabase
      .from("catalogue_subjects")
      .select(
        "catalogue_key, display_name, education_level, subject_field, production_subject_id, availability_status, is_active",
      )
      .order("display_name", { ascending: true }),
  ]);

  if (subjectsRes.error) throw subjectsRes.error;
  if (catalogueRes.error) throw catalogueRes.error;

  const englishSubjects = (subjectsRes.data || []).filter((item) =>
    /english/i.test(item.name),
  );
  const englishCatalogue = (catalogueRes.data || []).filter((item) =>
    /english/i.test(item.display_name || item.catalogue_key || ""),
  );

  console.log("SUBJECTS_MATCHING_ENGLISH");
  console.log(JSON.stringify(englishSubjects, null, 2));
  console.log("CATALOGUE_MATCHING_ENGLISH");
  console.log(JSON.stringify(englishCatalogue, null, 2));
  const ids = [
    ...new Set(
      (englishCatalogue || [])
        .map((item) => item.production_subject_id)
        .filter(Boolean),
    ),
  ];
  if (ids.length) {
    const { data: questions, error: questionError } = await supabase
      .from("questions")
      .select("id, subject_id, legacy_id, is_active")
      .in("subject_id", ids);
    if (questionError) throw questionError;
    console.log("QUESTIONS_FOR_ENGLISH_IDS");
    console.log(
      JSON.stringify(
        {
          ids,
          count: (questions || []).length,
          active: (questions || []).filter((q) => q.is_active).length,
          sample: (questions || []).slice(0, 10),
        },
        null,
        2,
      ),
    );
  }
})();
