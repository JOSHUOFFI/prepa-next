const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const cleaned = line.trim();
  if (!cleaned || cleaned.startsWith('#')) continue;
  const equalsIndex = cleaned.indexOf('=');
  if (equalsIndex === -1) continue;
  env[cleaned.slice(0, equalsIndex)] = cleaned.slice(equalsIndex + 1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing Supabase env');
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  const targets = ['English Studies', 'Mathematics', 'Business Studies', 'Christian Religious Studies'];
  const { data: catalogueRows, error: catErr } = await supabase
    .from('catalogue_subjects')
    .select('catalogue_key, display_name, production_subject_id, availability_status, is_active')
    .in('display_name', targets);

  if (catErr) throw catErr;
  console.log('CATALOGUE_ROWS');
  console.log(JSON.stringify(catalogueRows, null, 2));

  const ids = (catalogueRows || []).map(r => r.production_subject_id).filter(Boolean);
  if (ids.length) {
    const { data: questionRows, error: qErr } = await supabase
      .from('questions')
      .select('id, subject_id, is_active')
      .in('subject_id', ids)
      .eq('is_active', true);

    if (qErr) throw qErr;
    console.log('QUESTION_ROWS');
    console.log(JSON.stringify(questionRows, null, 2));

    const counts = {};
    for (const row of (questionRows || [])) {
      counts[row.subject_id] = (counts[row.subject_id] || 0) + 1;
    }
    console.log('COUNTS');
    console.log(JSON.stringify(counts, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
