# Supabase Setup

This document covers the Phase 4A database foundation for `prepa-next`. The existing CBT remains local and is intentionally not connected to Supabase.

## Create a project

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **Project Settings > API**.
3. Copy the **Project URL** and the publishable key (`sb_publishable_...`). Never use or expose a service-role key in this application.
4. From `prepa-next`, copy `.env.example` to `.env.local` and fill in the two variables shown there. `.env.local` is ignored by git.

## Apply the database

Install or invoke the Supabase CLI separately. Using `npx` avoids adding a global dependency:

```text
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase db seed
```

The migration creates the tables, relationships, constraints, indexes, and RLS. The seed is idempotent and contains 5 classes, 3 terms, and 18 subjects in the five categories defined in `lib/constants.ts`.

## Generate TypeScript types

After applying the migration, generate database types into the Next.js project:

```text
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

Treat `database.types.ts` as generated output. Regenerate it after every schema change. The current client helpers do not import generated types yet because the CBT is still local.

## Verify

In the Supabase SQL Editor, verify that the nine tables exist, foreign keys and indexes are present, and RLS is enabled for every table. Confirm that the seed contains 5 classes, 3 terms, and 18 subjects.

Policies target the `authenticated` role and `auth.uid()`; anonymous access is not granted, and no fake student identity is created. Students can read their own profile, attempts, and answers, create attempts, and edit only their own ungraded answers. Students cannot write questions, options, grades, or another student's records. Teacher and admin policies are deferred until authentication and role management exist.

## Migration strategy

Phase 4B should read `data/legacy-question-bank.ts`, map subject/class/term names to reference IDs, insert questions and options, preserve legacy IDs, explanations, correct answers, and points, then validate counts and uniqueness. It must report malformed records, duplicate IDs, missing mappings, and malformed options rather than silently discarding them. The 1,752 legacy questions are not migrated by Phase 4A.

## Question Bank Migration

Run the repeatable importer from `prepa-next`:

```text
npm run migrate:questions -- --dry-run
npm run migrate:questions
```

The source is `data/legacy-question-bank.ts`. The dry run parses every record, resolves answers represented as option letters or full option text, validates subject/class/term mappings, reports duplicate IDs and duplicate question text, and lists malformed records without writing to Supabase. The two null Mathematics records are fatal and are skipped; `E30` is also skipped because its answer text matches two options and cannot be resolved safely. Missing optional class and term fields remain null rather than being fabricated.

The live importer requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` for server-side writes. It uses the unique `(subject_id, legacy_id)` constraint and option labels for idempotent upserts, so reruns update existing records instead of creating copies. It does not delete existing rows or stale options. Validate the result with `questions` and `question_options` counts in the Supabase SQL Editor. The CBT remains connected to local data and localStorage.

Authentication, result migration, admin migration, AI Classroom migration, and the CBT rewrite are also excluded. Phase 4B is: **Migrate the 1,752-question legacy question bank into Supabase.**
