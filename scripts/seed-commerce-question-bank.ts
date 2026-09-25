import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { LEGACY_QUESTIONS_BY_SUBJECT } from "@/data/legacy-question-bank";

loadEnvConfig(process.cwd());

const SUBJECT_ID = "d319d302-334b-4eb4-b403-b46f7a794a09";
const SOURCE_KEY = "Commerce";

const ARCHIVE_IDS = new Set([
  "COM26", "COM27", "COM61", "COM62", "COM63", "COM76", "COM77", "COM78", "COM79", "COM80",
  ...Array.from({ length: 13 }, (_, i) => `COM${48 + i}`),
  ...Array.from({ length: 23 }, (_, i) => `COM${121 + i}`),
  "COM191", "COM192", "COM194", "COM119",
]);

const topicIds: Record<string, string[]> = {
  "Meaning and Scope of Commerce": ["COM1", "COM8"],
  "Trade and Methods of Buying and Selling": ["COM9", "COM10", "COM11", "COM12", "COM13"],
  "Business Ownership and Organisations": ["COM2", "COM3", "COM4", "COM5", "COM6", "COM7"],
  "Entrepreneurship and Business Capital": Array.from({ length: 7 }, (_, i) => `COM${41 + i}`),
  "Commercial Documents and Agency": ["COM14", "COM15", "COM30", "COM31", "COM32", "COM33", "COM34", "COM35"],
  "Aids to Trade and Commercial Services": ["COM16", "COM17", "COM18", "COM19", "COM20", "COM21", "COM22", "COM28", "COM29", "COM114", "COM115", "COM116", "COM117", "COM118", "COM120", "COM195", "COM196"],
  "Commercial Institutions and Trade Associations": ["COM23", "COM24", "COM25", "COM36", "COM37", "COM38", "COM39", "COM40", ...Array.from({ length: 17 }, (_, i) => `COM${144 + i}`)],
  "Business Finance and Industrial Relations": Array.from({ length: 12 }, (_, i) => `COM${64 + i}`),
  "International Trade and Trade Terms": Array.from({ length: 21 }, (_, i) => `COM${81 + i}`),
  "Foreign Exchange, Taxation and Trade Regulation": Array.from({ length: 12 }, (_, i) => `COM${102 + i}`),
  "Marketing, Promotion and Market Research": [...Array.from({ length: 30 }, (_, i) => `COM${161 + i}`), "COM198", "COM199", "COM200"],
  "Consumer Protection and Product Standards": ["COM193", "COM197"],
};

const medium = new Set(["COM14", "COM15", "COM30", "COM31", "COM32", "COM33", "COM34", "COM35", ...Array.from({ length: 33 }, (_, i) => `COM${81 + i}`), ...Array.from({ length: 40 }, (_, i) => `COM${161 + i}`), "COM193", "COM197", "COM198", "COM199", "COM200"]);

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL and service-role key are required.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const source = (LEGACY_QUESTIONS_BY_SUBJECT as Record<string, unknown[]>)[SOURCE_KEY] ?? [];
  if (source.length !== 200) throw new Error(`Expected 200 ${SOURCE_KEY} source records; found ${source.length}.`);
  const { data: subject, error: subjectError } = await db.from("subjects").select("id,name,is_active").eq("id", SUBJECT_ID).maybeSingle();
  if (subjectError) throw subjectError;
  if (!subject || subject.name !== "Commerce" || !subject.is_active) throw new Error("Canonical Commerce subject guard failed.");
  const { data: topics, error: topicsError } = await db.from("topics").select("id,name").eq("subject_id", SUBJECT_ID);
  if (topicsError) throw topicsError;
  const byName = new Map((topics ?? []).map(t => [t.name, t.id]));
  const mapping = new Map<string, string>();
  for (const [name, ids] of Object.entries(topicIds)) {
    const topicId = byName.get(name); if (!topicId) throw new Error(`Missing Commerce topic: ${name}`);
    for (const id of ids) { if (mapping.has(id)) throw new Error(`Duplicate topic mapping for ${id}`); mapping.set(id, topicId); }
  }
  const { data: questions, error: questionError } = await db.from("questions").select("id,legacy_id,is_active,topic_id,difficulty").eq("subject_id", SUBJECT_ID);
  if (questionError) throw questionError;
  let archived = 0, updated = 0;
  for (const q of questions ?? []) {
    const shouldArchive = ARCHIVE_IDS.has(q.legacy_id);
    const topicId = mapping.get(q.legacy_id);
    if (!shouldArchive && !topicId) throw new Error(`No reviewed topic mapping for active Commerce question ${q.legacy_id}`);
    const next = { is_active: !shouldArchive, topic_id: shouldArchive ? null : topicId, difficulty: shouldArchive ? null : (medium.has(q.legacy_id) ? "medium" : "easy") };
    if (q.is_active !== next.is_active || q.topic_id !== next.topic_id || q.difficulty !== next.difficulty) {
      const { error } = await db.from("questions").update(next).eq("id", q.id); if (error) throw error;
      if (shouldArchive) archived += 1; else updated += 1;
    }
  }
  const { data: final, error: finalError } = await db.from("questions").select("legacy_id,topic_id,difficulty").eq("subject_id", SUBJECT_ID).eq("is_active", true);
  if (finalError) throw finalError;
  console.log(JSON.stringify({ sourceCount: source.length, archived, updated, active: final?.length ?? 0, unassigned: (final ?? []).filter(q => !q.topic_id).length, difficulty: Object.fromEntries(["easy", "medium", "hard"].map(x => [x, (final ?? []).filter(q => q.difficulty === x).length])) }, null, 2));
}
main().catch(error => { console.error("Commerce remediation failed:", error); process.exit(1); });
