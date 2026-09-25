-- Phase 2E: approved Nigerian History curriculum foundation.
-- Preserves the existing History production UUID and adds no questions.

do $$
begin
  if not exists (
    select 1 from public.subjects
    where id = '41fcf4c5-0a9b-4486-8de6-b98fe1c2c412'
      and name = 'History' and slug = 'history' and is_active = true
  ) then
    raise exception 'Canonical History subject guard failed';
  end if;
  if (select count(*) from public.classes where name in ('JSS1', 'JSS2', 'JSS3')) <> 3 then
    raise exception 'JSS class guard failed for Nigerian History curriculum';
  end if;
end $$;

with theme_seed(class_name, name) as (
  values
    ('JSS1', 'Pre-colonial Nigerian Peoples and States'),
    ('JSS1', 'Pre-colonial Economy and Inter-group Relations'),
    ('JSS2', 'External Contact and Economic Change'),
    ('JSS2', 'British Conquest and Colonial Rule'),
    ('JSS3', 'Nationalism, Constitutional Change and Independence'),
    ('JSS3', 'Nigeria Since Independence')
), prepared as (
  select
    'theme_' || substr(md5('nigerian-history|' || class_name || '|' || name), 1, 16) as id,
    '41fcf4c5-0a9b-4486-8de6-b98fe1c2c412'::uuid as subject_id,
    (select id from public.classes where name = class_name) as class_id,
    name
  from theme_seed
)
insert into public.curriculum_themes (id, subject_id, class_id, name, verification_status, source_document, source_url, source_pages)
select id, subject_id, class_id, name, 'review_required', 'jss1-3_history.pdf', 'https://www.nerdc.gov.ng/content_manager/jss/jss1-3_history.pdf', '{}'::integer[]
from prepared
on conflict (id) do update set name = excluded.name, verification_status = excluded.verification_status, source_document = excluded.source_document, source_url = excluded.source_url, source_pages = excluded.source_pages, updated_at = now();

with subtheme_seed(class_name, theme_name, name) as (
  values
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Historical Study and Nigerian Peoples'),
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Major Pre-colonial States and Societies'),
    ('JSS1', 'Pre-colonial Economy and Inter-group Relations', 'Indigenous Political and Social Organisation'),
    ('JSS1', 'Pre-colonial Economy and Inter-group Relations', 'Traditional Economy, Trade and Relations'),
    ('JSS2', 'External Contact and Economic Change', 'Trans-Saharan, Atlantic and European Contact'),
    ('JSS2', 'External Contact and Economic Change', 'Missionary Activity and Legitimate Trade'),
    ('JSS2', 'British Conquest and Colonial Rule', 'British Conquest and Administration'),
    ('JSS2', 'British Conquest and Colonial Rule', 'Amalgamation and Colonial Policies'),
    ('JSS3', 'Nationalism, Constitutional Change and Independence', 'Nationalism and Nigerian Nationalists'),
    ('JSS3', 'Nationalism, Constitutional Change and Independence', 'Constitutional Development and Independence'),
    ('JSS3', 'Nigeria Since Independence', 'Early Post-independence Politics and Civil War'),
    ('JSS3', 'Nigeria Since Independence', 'Later Military Rule and Democratic Government')
), prepared as (
  select
    'subtheme_' || substr(md5('nigerian-history|' || class_name || '|' || theme_name || '|' || name), 1, 16) as id,
    'theme_' || substr(md5('nigerian-history|' || class_name || '|' || theme_name), 1, 16) as theme_id,
    name
  from subtheme_seed
)
insert into public.curriculum_subthemes (id, theme_id, name, verification_status, source_document, source_url, source_pages)
select id, theme_id, name, 'review_required', 'jss1-3_history.pdf', 'https://www.nerdc.gov.ng/content_manager/jss/jss1-3_history.pdf', '{}'::integer[]
from prepared
on conflict (id) do update set name = excluded.name, verification_status = excluded.verification_status, source_document = excluded.source_document, source_url = excluded.source_url, source_pages = excluded.source_pages, updated_at = now();

with topic_seed(class_name, theme_name, subtheme_name, name) as (
  values
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Historical Study and Nigerian Peoples', 'Sources and Uses of Nigerian History'),
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Historical Study and Nigerian Peoples', 'Peoples and Regions of Pre-colonial Nigeria'),
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Major Pre-colonial States and Societies', 'Hausa City States and the Sokoto Caliphate'),
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Major Pre-colonial States and Societies', 'Kanem-Borno Empire'),
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Major Pre-colonial States and Societies', 'Oyo Empire and Yoruba Political Organisation'),
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Major Pre-colonial States and Societies', 'Benin Kingdom'),
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Major Pre-colonial States and Societies', 'Igbo Political and Social Organisation'),
    ('JSS1', 'Pre-colonial Nigerian Peoples and States', 'Major Pre-colonial States and Societies', 'Niger Delta Societies'),
    ('JSS1', 'Pre-colonial Economy and Inter-group Relations', 'Indigenous Political and Social Organisation', 'Traditional Institutions and Leadership'),
    ('JSS1', 'Pre-colonial Economy and Inter-group Relations', 'Indigenous Political and Social Organisation', 'Age Grades, Secret Societies and Community Organisation'),
    ('JSS1', 'Pre-colonial Economy and Inter-group Relations', 'Traditional Economy, Trade and Relations', 'Traditional Occupations and Economic Activities'),
    ('JSS1', 'Pre-colonial Economy and Inter-group Relations', 'Traditional Economy, Trade and Relations', 'Inter-group Relations, Migration and Conflict'),
    ('JSS2', 'External Contact and Economic Change', 'Trans-Saharan, Atlantic and European Contact', 'Trans-Saharan Trade and Its Effects'),
    ('JSS2', 'External Contact and Economic Change', 'Trans-Saharan, Atlantic and European Contact', 'Trans-Atlantic Trade and European Contact'),
    ('JSS2', 'External Contact and Economic Change', 'Missionary Activity and Legitimate Trade', 'Christian Missionary Activities in Nigeria'),
    ('JSS2', 'External Contact and Economic Change', 'Missionary Activity and Legitimate Trade', 'Legitimate Trade and the Palm-oil Economy'),
    ('JSS2', 'British Conquest and Colonial Rule', 'British Conquest and Administration', 'British Conquest of Nigerian Territories'),
    ('JSS2', 'British Conquest and Colonial Rule', 'British Conquest and Administration', 'Indirect Rule and Colonial Administration'),
    ('JSS2', 'British Conquest and Colonial Rule', 'Amalgamation and Colonial Policies', 'The 1914 Amalgamation of Nigeria'),
    ('JSS2', 'British Conquest and Colonial Rule', 'Amalgamation and Colonial Policies', 'Colonial Economic, Social and Educational Policies'),
    ('JSS3', 'Nationalism, Constitutional Change and Independence', 'Nationalism and Nigerian Nationalists', 'Causes and Growth of Nigerian Nationalism'),
    ('JSS3', 'Nationalism, Constitutional Change and Independence', 'Nationalism and Nigerian Nationalists', 'Nigerian Nationalists and Nationalist Organisations'),
    ('JSS3', 'Nationalism, Constitutional Change and Independence', 'Constitutional Development and Independence', 'Constitutional Development Under British Rule'),
    ('JSS3', 'Nationalism, Constitutional Change and Independence', 'Constitutional Development and Independence', 'Independence and the 1963 Republic'),
    ('JSS3', 'Nigeria Since Independence', 'Early Post-independence Politics and Civil War', 'The First Republic and the 1966 Military Intervention'),
    ('JSS3', 'Nigeria Since Independence', 'Early Post-independence Politics and Civil War', 'The Nigerian Civil War'),
    ('JSS3', 'Nigeria Since Independence', 'Early Post-independence Politics and Civil War', 'The Second Republic'),
    ('JSS3', 'Nigeria Since Independence', 'Later Military Rule and Democratic Government', 'Later Military Rule and Political Transition'),
    ('JSS3', 'Nigeria Since Independence', 'Later Military Rule and Democratic Government', 'Return to Democratic Government Since 1999'),
    ('JSS3', 'Nigeria Since Independence', 'Later Military Rule and Democratic Government', 'Major Post-independence Personalities and National Events')
), prepared as (
  select
    'topic_' || substr(md5('nigerian-history|' || class_name || '|' || theme_name || '|' || subtheme_name || '|' || name), 1, 16) as curriculum_id,
    'subtheme_' || substr(md5('nigerian-history|' || class_name || '|' || theme_name || '|' || subtheme_name), 1, 16) as curriculum_subtheme_id,
    name
  from topic_seed
)
insert into public.topics (subject_id, class_id, term_id, name, is_active, curriculum_id, curriculum_subtheme_id, curriculum_verification_status, curriculum_source_document, curriculum_source_url, curriculum_source_pages)
select '41fcf4c5-0a9b-4486-8de6-b98fe1c2c412'::uuid, null, null, name, true, curriculum_id, curriculum_subtheme_id, 'review_required', 'jss1-3_history.pdf', 'https://www.nerdc.gov.ng/content_manager/jss/jss1-3_history.pdf', '{}'::integer[]
from prepared
on conflict (curriculum_id) do update set name = excluded.name, curriculum_subtheme_id = excluded.curriculum_subtheme_id, curriculum_verification_status = excluded.curriculum_verification_status, curriculum_source_document = excluded.curriculum_source_document, curriculum_source_url = excluded.curriculum_source_url, curriculum_source_pages = excluded.curriculum_source_pages, is_active = true, updated_at = now();

update public.catalogue_subjects
set production_subject_id = '41fcf4c5-0a9b-4486-8de6-b98fe1c2c412'::uuid,
    relationship_type = 'MAP_EXISTING',
    availability_status = 'mapped_no_questions',
    updated_at = now()
where catalogue_key = 'nigerian_history';

do $$
begin
  if (select count(*) from public.curriculum_themes where subject_id = '41fcf4c5-0a9b-4486-8de6-b98fe1c2c412') <> 6 then raise exception 'Expected six Nigerian History themes'; end if;
  if (select count(*) from public.curriculum_subthemes cs join public.curriculum_themes ct on ct.id = cs.theme_id where ct.subject_id = '41fcf4c5-0a9b-4486-8de6-b98fe1c2c412') <> 12 then raise exception 'Expected twelve Nigerian History subthemes'; end if;
  if (select count(*) from public.topics where subject_id = '41fcf4c5-0a9b-4486-8de6-b98fe1c2c412') <> 30 then raise exception 'Expected thirty Nigerian History topics'; end if;
end $$;
