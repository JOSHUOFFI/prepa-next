-- Phase 2 Agricultural Science foundation. No questions are created or changed.
-- The verified rows below are deliberately mapped from the Agriculture component
-- of the official NERDC Pre-Vocational Studies curriculum, not inferred by name.
do $$ begin
  if not exists (
    select 1 from public.subjects
    where id = 'ab79e100-9e4c-4a9e-b952-19df15b2443c'
      and name = 'Agricultural Science'
      and slug = 'agricultural-science'
      and is_active
  ) then
    raise exception 'Canonical Agricultural Science subject guard failed';
  end if;
  if (select count(*) from public.classes where name in ('JSS1', 'JSS2')) <> 2 then
    raise exception 'JSS class guard failed';
  end if;
end $$;

with seed(class_name, theme_name, subtheme_name, source_pages) as (values
  ('JSS1', 'Agriculture', 'Concept and Medium of Agricultural Production', array[2,3,4,5]::integer[]),
  ('JSS2', 'Agriculture', 'Processes of Agricultural Production', array[11,12,13,14,16,17]::integer[])
), themes as (
  select distinct
    case class_name when 'JSS1' then 'theme_d708a96fd30a05c1' else 'theme_75486166e6ca51d3' end as id,
    'ab79e100-9e4c-4a9e-b952-19df15b2443c'::uuid as subject_id,
    (select id from public.classes where name = class_name) as class_id,
    theme_name as name,
    source_pages
  from seed
)
insert into public.curriculum_themes (id, subject_id, class_id, name, verification_status, source_document, source_url, source_pages)
select id, subject_id, class_id, name, 'verified', 'jss1-3_prevoc.pdf', 'https://www.nerdc.gov.ng/content_manager/jss/jss1-3_prevoc.pdf', source_pages from themes
on conflict (id) do update set
  name = excluded.name, verification_status = excluded.verification_status,
  source_document = excluded.source_document, source_url = excluded.source_url,
  source_pages = excluded.source_pages, updated_at = now();

with seed(class_name, name, source_pages) as (values
  ('JSS1', 'Concept and Medium of Agricultural Production', array[2,3,4,5]::integer[]),
  ('JSS2', 'Processes of Agricultural Production', array[11,12,13,14,16,17]::integer[])
)
insert into public.curriculum_subthemes (id, theme_id, name, verification_status, source_document, source_url, source_pages)
select
  case class_name when 'JSS1' then 'subtheme_4b4d8b4df214f1ed' else 'subtheme_a3fa27b24a6093fa' end,
  case class_name when 'JSS1' then 'theme_d708a96fd30a05c1' else 'theme_75486166e6ca51d3' end,
  name, 'verified', 'jss1-3_prevoc.pdf', 'https://www.nerdc.gov.ng/content_manager/jss/jss1-3_prevoc.pdf', source_pages
from seed
on conflict (id) do update set
  name = excluded.name, verification_status = excluded.verification_status,
  source_document = excluded.source_document, source_url = excluded.source_url,
  source_pages = excluded.source_pages, updated_at = now();

with seed(curriculum_id, curriculum_subtheme_id, name, source_pages) as (values
  ('topic_ebb1544f048f3d62', 'subtheme_4b4d8b4df214f1ed', 'Classes and Uses of Crops', array[2]::integer[]),
  ('topic_6ea205874d9a7877', 'subtheme_4b4d8b4df214f1ed', 'Classes and Uses of Farm Animals', array[3]::integer[]),
  ('topic_addeddb6a39cc339', 'subtheme_4b4d8b4df214f1ed', 'Methods of Weed and Pests Control', array[4]::integer[]),
  ('topic_6014bbe44eb305ef', 'subtheme_4b4d8b4df214f1ed', 'Factors of Agricultural Production', array[5]::integer[]),
  ('topic_213518d2637efc0d', 'subtheme_a3fa27b24a6093fa', 'Farm Structures and Buildings', array[11]::integer[]),
  ('topic_6388b2676ea7ab34', 'subtheme_a3fa27b24a6093fa', 'Crop Propagation and Cultural Practices', array[12]::integer[]),
  ('topic_0f117a6b4916a14c', 'subtheme_a3fa27b24a6093fa', 'Agricultural Practices', array[13]::integer[]),
  ('topic_066ef64f228a0f62', 'subtheme_a3fa27b24a6093fa', 'Animal Feeds and Feeding', array[14]::integer[]),
  ('topic_3cce37c5385f2c23', 'subtheme_a3fa27b24a6093fa', 'Animal Pests and Diseases', array[14]::integer[]),
  ('topic_586671dbeb9129d7', 'subtheme_a3fa27b24a6093fa', 'Fishery', array[16]::integer[]),
  ('topic_4ea0477f85c13e44', 'subtheme_a3fa27b24a6093fa', 'Forests and Forest Uses', array[17]::integer[])
)
insert into public.topics (subject_id, class_id, term_id, name, is_active, curriculum_id, curriculum_subtheme_id, curriculum_verification_status, curriculum_source_document, curriculum_source_url, curriculum_source_pages)
select 'ab79e100-9e4c-4a9e-b952-19df15b2443c'::uuid, null, null, name, true, curriculum_id, curriculum_subtheme_id, 'verified', 'jss1-3_prevoc.pdf', 'https://www.nerdc.gov.ng/content_manager/jss/jss1-3_prevoc.pdf', source_pages
from seed
on conflict (curriculum_id) do update set
  name = excluded.name, curriculum_subtheme_id = excluded.curriculum_subtheme_id,
  curriculum_verification_status = excluded.curriculum_verification_status,
  curriculum_source_document = excluded.curriculum_source_document,
  curriculum_source_url = excluded.curriculum_source_url,
  curriculum_source_pages = excluded.curriculum_source_pages, is_active = true, updated_at = now();

with seed(curriculum_id, objectives) as (values
  ('topic_ebb1544f048f3d62', '["Identify crop plant forms.","Classify crops according to forms, life span, uses, and types.","State the various uses of crops."]'::jsonb),
  ('topic_6ea205874d9a7877', '["Describe different forms of farm animals.","Identify the basic characteristics of different farm animals.","List farm animals."]'::jsonb),
  ('topic_addeddb6a39cc339', '["List the characteristics of weeds.","Indicate the uses of weeds.","Briefly discuss methods of weed control.","State the effects of weed control methods on vegetation and soil."]'::jsonb),
  ('topic_6014bbe44eb305ef', '["List the basic factors of production.","Describe the uses of each factor in agricultural production."]'::jsonb),
  ('topic_213518d2637efc0d', '["Describe and identify various farm structures and buildings."]'::jsonb),
  ('topic_6388b2676ea7ab34', '["Define crop propagation.","State methods of crop propagation."]'::jsonb),
  ('topic_0f117a6b4916a14c', '["Describe pre-planting, planting, post-planting, harvesting and post-harvesting operations."]'::jsonb),
  ('topic_066ef64f228a0f62', '["State the meaning of feeding.","List types of feedstuffs.","Mention feeding tools."]'::jsonb),
  ('topic_3cce37c5385f2c23', '["List four farm animal diseases.","State methods of transmission of farm animal diseases."]'::jsonb),
  ('topic_586671dbeb9129d7', '["Define fishery.","Classify fishes."]'::jsonb),
  ('topic_4ea0477f85c13e44', '["Describe forests."]'::jsonb)
)
insert into public.curriculum_objective_sets (id, topic_id, verification_status, objectives, source_document, source_url, source_pages)
select 'objectives_' || substr(md5('agricultural-science|' || seed.curriculum_id), 1, 16), topics.id, 'verified', seed.objectives, 'jss1-3_prevoc.pdf', 'https://www.nerdc.gov.ng/content_manager/jss/jss1-3_prevoc.pdf', topics.curriculum_source_pages
from seed join public.topics topics on topics.curriculum_id = seed.curriculum_id
on conflict (topic_id) do update set
  verification_status = excluded.verification_status, objectives = excluded.objectives,
  source_document = excluded.source_document, source_url = excluded.source_url,
  source_pages = excluded.source_pages, updated_at = now();

do $$ begin
  if (select count(*) from public.curriculum_themes where subject_id = 'ab79e100-9e4c-4a9e-b952-19df15b2443c') <> 2 then raise exception 'Expected two Agricultural Science themes'; end if;
  if (select count(*) from public.curriculum_subthemes cs join public.curriculum_themes ct on ct.id = cs.theme_id where ct.subject_id = 'ab79e100-9e4c-4a9e-b952-19df15b2443c') <> 2 then raise exception 'Expected two Agricultural Science subthemes'; end if;
  if (select count(*) from public.topics where subject_id = 'ab79e100-9e4c-4a9e-b952-19df15b2443c') <> 11 then raise exception 'Expected eleven Agricultural Science topics'; end if;
end $$;
