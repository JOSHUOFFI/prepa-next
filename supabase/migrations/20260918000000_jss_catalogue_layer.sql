-- B6.7.3: additive JSS1-JSS3 catalogue metadata.
-- This migration does not alter production subjects, questions, topics, or exam data.

create table if not exists public.catalogue_subjects (
  catalogue_key text primary key check (catalogue_key ~ '^[a-z][a-z0-9_]*$'),
  display_name text not null check (length(btrim(display_name)) > 0),
  category text not null check (category in (
    'core_academic',
    'nigerian_language',
    'religion',
    'optional_language',
    'trade_vocational'
  )),
  production_subject_id uuid references public.subjects(id) on delete restrict,
  relationship_type text not null check (relationship_type in (
    'MAP_EXISTING',
    'NEW_CATALOGUE_IDENTITY',
    'SEPARATE_FROM_EXISTING',
    'UNRESOLVED'
  )),
  availability_status text not null check (availability_status in (
    'mapped_no_questions',
    'mapping_required',
    'source_review_required',
    'scope_decision_required',
    'not_ready'
  )),
  selection_group text,
  selection_rule text not null default 'independent' check (selection_rule in (
    'independent',
    'exactly_one',
    'applicable_option'
  )),
  source_identity text,
  source_reference text,
  sort_order integer not null unique check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (relationship_type = 'MAP_EXISTING' and production_subject_id is not null)
    or (relationship_type <> 'MAP_EXISTING' and production_subject_id is null)
  ),
  check (
    (selection_group = 'nigerian_language' and category = 'nigerian_language' and selection_rule = 'exactly_one')
    or (selection_group = 'religion' and category = 'religion' and selection_rule = 'applicable_option')
    or (selection_group is null and selection_rule = 'independent')
  )
);

create index if not exists catalogue_subjects_active_sort_idx
  on public.catalogue_subjects(is_active, sort_order);
create index if not exists catalogue_subjects_production_subject_idx
  on public.catalogue_subjects(production_subject_id)
  where production_subject_id is not null;
create index if not exists catalogue_subjects_selection_group_idx
  on public.catalogue_subjects(selection_group)
  where selection_group is not null;

-- Refuse to seed a mapping if the referenced production row is missing or has
-- changed identity. No production subject row is created by this migration.
do $$
begin
  if not exists (
    select 1 from public.subjects
    where id = '91f37d59-3401-47c5-ae18-46ead707c570'
      and name = 'Mathematics'
      and slug = 'mathematics'
      and is_active = true
  ) then
    raise exception 'Catalogue mapping guard failed for Mathematics';
  end if;
  if not exists (
    select 1 from public.subjects
    where id = '5b894bfe-6f29-41a6-907c-26a4c2f11fff'
      and name = 'Business Studies'
      and slug = 'business-studies'
      and is_active = true
  ) then
    raise exception 'Catalogue mapping guard failed for Business Studies';
  end if;
  if not exists (
    select 1 from public.subjects
    where id = 'a0e64f96-d382-4cee-9f84-b1e6b5e075c6'
      and name = 'English'
      and slug = 'english'
      and is_active = true
  ) then
    raise exception 'Catalogue mapping guard failed for English';
  end if;
  if not exists (
    select 1 from public.subjects
    where id = '5e4ff239-fd12-4765-b035-70ea77ecee6c'
      and name = 'CRS'
      and slug = 'crs'
      and is_active = true
  ) then
    raise exception 'Catalogue mapping guard failed for CRS';
  end if;
end
$$;

insert into public.catalogue_subjects (
  catalogue_key,
  display_name,
  category,
  production_subject_id,
  relationship_type,
  availability_status,
  selection_group,
  selection_rule,
  source_identity,
  source_reference,
  sort_order
)
values
  ('english_studies', 'English Studies', 'core_academic', 'a0e64f96-d382-4cee-9f84-b1e6b5e075c6', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'ENGLISH_STUDIES', 'B6.6D.1 documented normalization; jss1-3_english_studies.pdf', 1),
  ('mathematics', 'Mathematics', 'core_academic', '91f37d59-3401-47c5-ae18-46ead707c570', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'MATHEMATICS', 'jss1-3_maths.pdf', 2),
  ('intermediate_science', 'Intermediate Science', 'core_academic', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'BASIC_SCIENCE_TECHNOLOGY', 'B6.7.1: no verified Intermediate Science equivalence', 3),
  ('physical_health_education', 'Physical & Health Education', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', null, 'B6.7.1: no verified source or production identity', 4),
  ('digital_technologies', 'Digital Technologies', 'core_academic', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'BASIC_SCIENCE_TECHNOLOGY', 'B6.7.1: Basic Technology is not established as equivalent', 5),
  ('nigerian_history', 'Nigerian History', 'core_academic', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'HISTORY', 'jss1-3_history.pdf; Nigerian scope requires decision', 6),
  ('social_citizenship_studies', 'Social & Citizenship Studies', 'core_academic', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'NVC', 'B6.6D.1 topic-level candidates: Civic, Social Studies, Government', 7),
  ('cultural_creative_arts', 'Cultural & Creative Arts', 'core_academic', null, 'NEW_CATALOGUE_IDENTITY', 'mapping_required', null, 'independent', 'CCA', 'jss1-3_cca.pdf; B6.6D.1 no production target', 8),
  ('business_studies', 'Business Studies', 'core_academic', '5b894bfe-6f29-41a6-907c-26a4c2f11fff', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'BUSINESS_STUDIES', 'jss1-3_business_studies.pdf', 9),
  ('hausa', 'Hausa', 'nigerian_language', null, 'UNRESOLVED', 'source_review_required', 'nigerian_language', 'exactly_one', 'HAUSA', 'jss1-3_hausa.pdf; limited verified JSS1 hierarchy', 10),
  ('igbo', 'Igbo', 'nigerian_language', null, 'UNRESOLVED', 'source_review_required', 'nigerian_language', 'exactly_one', 'IGBO', 'jss1-3_igbo.pdf; limited verified JSS1 hierarchy', 11),
  ('yoruba', 'Yoruba', 'nigerian_language', null, 'UNRESOLVED', 'source_review_required', 'nigerian_language', 'exactly_one', 'YORUBA', 'jss1-3_yoruba.pdf; specialized review required', 12),
  ('christian_religious_studies', 'Christian Religious Studies', 'religion', '5e4ff239-fd12-4765-b035-70ea77ecee6c', 'MAP_EXISTING', 'mapped_no_questions', 'religion', 'applicable_option', 'CRS', 'B6.6D.1 documented CRS normalization; jss1-3_crs.pdf', 13),
  ('islamic_studies', 'Islamic Studies', 'religion', null, 'NEW_CATALOGUE_IDENTITY', 'source_review_required', 'religion', 'applicable_option', 'ISLAMIC_RELIGIOUS_STUDIES', 'jss1-3_islamic.pdf; partial source hierarchy', 14),
  ('french', 'French', 'optional_language', null, 'NEW_CATALOGUE_IDENTITY', 'source_review_required', null, 'independent', 'FRENCH', 'jss1-3_french.pdf; review gaps remain', 15),
  ('arabic_language', 'Arabic Language', 'optional_language', null, 'UNRESOLVED', 'source_review_required', null, 'independent', 'ARABIC', 'jss1-3_arabic.pdf; RTL review required', 16),
  ('solar_photovoltaic_installation_maintenance', 'Solar Photovoltaic Installation & Maintenance', 'trade_vocational', null, 'UNRESOLVED', 'not_ready', null, 'independent', null, 'B6.7.1: no verified trade identity', 17),
  ('fashion_design_garment_making', 'Fashion Design & Garment Making', 'trade_vocational', null, 'UNRESOLVED', 'not_ready', null, 'independent', null, 'B6.7.1: no verified trade identity', 18),
  ('livestock_farming', 'Livestock Farming', 'trade_vocational', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'PREVOC', 'Agriculture is broader; no specific Livestock Farming identity', 19),
  ('beauty_cosmetology', 'Beauty & Cosmetology', 'trade_vocational', null, 'UNRESOLVED', 'not_ready', null, 'independent', null, 'B6.7.1: no verified trade identity', 20),
  ('computer_hardware_gsm_repairs', 'Computer Hardware & GSM Repairs', 'trade_vocational', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'BASIC_SCIENCE_TECHNOLOGY', 'Basic Technology is related but not equivalent', 21),
  ('horticulture_crop_production', 'Horticulture & Crop Production', 'trade_vocational', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'PREVOC', 'Agriculture is broader; no specific Horticulture identity', 22)
on conflict (catalogue_key) do update set
  display_name = excluded.display_name,
  category = excluded.category,
  production_subject_id = excluded.production_subject_id,
  relationship_type = excluded.relationship_type,
  availability_status = excluded.availability_status,
  selection_group = excluded.selection_group,
  selection_rule = excluded.selection_rule,
  source_identity = excluded.source_identity,
  source_reference = excluded.source_reference,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

alter table public.catalogue_subjects enable row level security;

drop policy if exists "Authenticated users can read active catalogue subjects"
  on public.catalogue_subjects;
create policy "Authenticated users can read active catalogue subjects"
  on public.catalogue_subjects for select to authenticated
  using (is_active = true);

drop policy if exists "Admins can manage catalogue subjects"
  on public.catalogue_subjects;
create policy "Admins can manage catalogue subjects"
  on public.catalogue_subjects for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')
  ));

-- Post-seed safety assertions: exactly 22 rows and exactly four mappings.
do $$
begin
  if (select count(*) from public.catalogue_subjects) <> 22 then
    raise exception 'Catalogue seed must contain exactly 22 rows';
  end if;
  if (select count(*) from public.catalogue_subjects where production_subject_id is not null) <> 4 then
    raise exception 'Catalogue seed must contain exactly four production mappings';
  end if;
  if exists (
    select 1 from public.catalogue_subjects
    where production_subject_id is null
      and relationship_type = 'MAP_EXISTING'
  ) then
    raise exception 'Unmapped catalogue row cannot use MAP_EXISTING';
  end if;
end
$$;
