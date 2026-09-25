-- Review-required hierarchy derived from the Economics legacy bank; no official
-- curriculum or page-level provenance is claimed.
do $$ begin
 if not exists(select 1 from public.subjects where id='a55ad82b-4630-491b-ae8d-76613c147d27' and name='Economics' and slug='economics' and is_active) then raise exception 'Canonical Economics subject guard failed'; end if;
 if not exists(select 1 from public.classes where name='SS1') then raise exception 'SS1 class guard failed'; end if;
end $$;
with seed(id,name) as (values
 ('theme_110d1a70f3d5d1cd','Microeconomics'),('theme_8f652cb58d8c7765','Macroeconomics and the Nigerian Economy'),('theme_9b2710d1923c84bb','International Economics'),('theme_93b3f2f3dab2fcd5','Development Economics')
)
insert into public.curriculum_themes(id,subject_id,class_id,name,verification_status,source_document,source_pages)
select id,'a55ad82b-4630-491b-ae8d-76613c147d27'::uuid,(select id from public.classes where name='SS1'),name,'review_required','data/legacy-question-bank.ts','{}'::integer[] from seed
on conflict(id) do update set name=excluded.name,verification_status=excluded.verification_status,source_document=excluded.source_document,source_pages=excluded.source_pages,updated_at=now();
with seed(id,theme_id,name) as (values
 ('subtheme_018fb973435b3d53','theme_110d1a70f3d5d1cd','Demand, Supply and Consumer Behaviour'),('subtheme_83c738f695792932','theme_110d1a70f3d5d1cd','Production, Costs and Market Structure'),
 ('subtheme_3b70c22a780e72d8','theme_8f652cb58d8c7765','National Income, Inflation and Unemployment'),('subtheme_764524562a2150a4','theme_8f652cb58d8c7765','Fiscal, Monetary and Nigerian Economy'),
 ('subtheme_9b87eb1981b0c8d8','theme_9b2710d1923c84bb','Balance of Payments and Exchange Rates'),('subtheme_60b6ae10f6b7503a','theme_9b2710d1923c84bb','Trade Theory and Economic Integration'),
 ('subtheme_6032a046fe0e0ae4','theme_93b3f2f3dab2fcd5','Growth, Poverty and Development Models'),('subtheme_73d79b8497e2e1f0','theme_93b3f2f3dab2fcd5','Population, Sustainability and Development Challenges')
)
insert into public.curriculum_subthemes(id,theme_id,name,verification_status,source_document,source_pages)
select id,theme_id,name,'review_required','data/legacy-question-bank.ts','{}'::integer[] from seed
on conflict(id) do update set name=excluded.name,verification_status=excluded.verification_status,source_document=excluded.source_document,source_pages=excluded.source_pages,updated_at=now();
with seed(curriculum_id,curriculum_subtheme_id,name) as (values
 ('topic_10c66c24fc6d4090','subtheme_018fb973435b3d53','Basic Economic Problems, Demand and Supply'),('topic_39bca64004a4313b','subtheme_018fb973435b3d53','Elasticity, Utility and Consumer Equilibrium'),('topic_7e632136a2a2dfd6','subtheme_83c738f695792932','Costs, Production Possibility and Scale'),('topic_68bc6137bd29b2ee','subtheme_83c738f695792932','Market Structures and Profit'),
 ('topic_45ac4812c2587c65','subtheme_3b70c22a780e72d8','National Income, Inflation and Unemployment'),('topic_ee282e4b5ca338a0','subtheme_764524562a2150a4','Fiscal and Monetary Policy'),('topic_bf758fd559b2a2bb','subtheme_764524562a2150a4','Nigerian Economy and Economic Institutions'),
 ('topic_00bcc5f629dfb0bc','subtheme_9b87eb1981b0c8d8','Balance of Payments and Foreign Exchange'),('topic_87b761a45fb27ef6','subtheme_60b6ae10f6b7503a','International Trade and Economic Integration'),
 ('topic_68f953473b23921a','subtheme_6032a046fe0e0ae4','Economic Growth, Poverty and Development Theory'),('topic_0518050b1c34697e','subtheme_73d79b8497e2e1f0','Population, Sustainability and Development Challenges')
)
insert into public.topics(subject_id,class_id,term_id,name,is_active,curriculum_id,curriculum_subtheme_id,curriculum_verification_status,curriculum_source_document,curriculum_source_pages)
select 'a55ad82b-4630-491b-ae8d-76613c147d27'::uuid,null,null,name,true,curriculum_id,curriculum_subtheme_id,'review_required','data/legacy-question-bank.ts','{}'::integer[] from seed
on conflict(curriculum_id) do update set name=excluded.name,curriculum_subtheme_id=excluded.curriculum_subtheme_id,curriculum_verification_status=excluded.curriculum_verification_status,curriculum_source_document=excluded.curriculum_source_document,curriculum_source_pages=excluded.curriculum_source_pages,is_active=true,updated_at=now();
