-- Phase 2 Commerce foundation.  The hierarchy is a review-required
-- classification of data/legacy-question-bank.ts; it does not claim official
-- curriculum or page-level provenance.
do $$ begin
  if not exists (select 1 from public.subjects where id='d319d302-334b-4eb4-b403-b46f7a794a09' and name='Commerce' and slug='commerce' and is_active) then
    raise exception 'Canonical Commerce subject guard failed';
  end if;
  if not exists (select 1 from public.classes where name='SS1') then
    raise exception 'SS1 class guard failed';
  end if;
end $$;

with seed(id,name) as (values
 ('theme_8abdc3221573c66d','Commerce Foundations and Business Organisation'),
 ('theme_9d5bb0c01139a711','Trade, Commercial Services and Regulation'),
 ('theme_e70cbbe9bfa04e8f','International Trade and Business Finance'),
 ('theme_e8cbbfbf2f0fd02c','Marketing and Consumer Protection')
)
insert into public.curriculum_themes(id,subject_id,class_id,name,verification_status,source_document,source_pages)
select id,'d319d302-334b-4eb4-b403-b46f7a794a09'::uuid,(select id from public.classes where name='SS1'),name,'review_required','data/legacy-question-bank.ts','{}'::integer[] from seed
on conflict(id) do update set name=excluded.name,verification_status=excluded.verification_status,source_document=excluded.source_document,source_pages=excluded.source_pages,updated_at=now();

with seed(id,theme_id,name) as (values
 ('subtheme_2b764a24610d0a4a','theme_8abdc3221573c66d','Commerce, Trade and Business Ownership'),
 ('subtheme_6598ec630b9b37a0','theme_8abdc3221573c66d','Entrepreneurship and Capital'),
 ('subtheme_15747052a39381d4','theme_9d5bb0c01139a711','Commercial Documents, Agency and Law'),
 ('subtheme_a80e292a8ba2c142','theme_9d5bb0c01139a711','Aids to Trade and Commercial Institutions'),
 ('subtheme_a08a589b8c4c9f89','theme_e70cbbe9bfa04e8f','International Trade, Exchange and Taxation'),
 ('subtheme_8072bf597cc1dc60','theme_e70cbbe9bfa04e8f','Business Finance and Industrial Relations'),
 ('subtheme_c6d2623b20fb3661','theme_e8cbbfbf2f0fd02c','Marketing, Promotion and Market Research'),
 ('subtheme_a0085c91b147f1b9','theme_e8cbbfbf2f0fd02c','Consumer Protection and Commercial Associations')
)
insert into public.curriculum_subthemes(id,theme_id,name,verification_status,source_document,source_pages)
select id,theme_id,name,'review_required','data/legacy-question-bank.ts','{}'::integer[] from seed
on conflict(id) do update set name=excluded.name,verification_status=excluded.verification_status,source_document=excluded.source_document,source_pages=excluded.source_pages,updated_at=now();

with seed(curriculum_id,curriculum_subtheme_id,name) as (values
 ('topic_9e6f1b8ca7ebc920','subtheme_2b764a24610d0a4a','Meaning and Scope of Commerce'),
 ('topic_67109961ec0dd60d','subtheme_2b764a24610d0a4a','Trade and Methods of Buying and Selling'),
 ('topic_a304264d434fe4b1','subtheme_2b764a24610d0a4a','Business Ownership and Organisations'),
 ('topic_a6be8f7d0a63f5e5','subtheme_6598ec630b9b37a0','Entrepreneurship and Business Capital'),
 ('topic_5423cb0d171cd7a4','subtheme_15747052a39381d4','Commercial Documents and Agency'),
 ('topic_1d5ddbb1decb6d55','subtheme_a80e292a8ba2c142','Aids to Trade and Commercial Services'),
 ('topic_16d74aa0d8c35d2a','subtheme_a80e292a8ba2c142','Commercial Institutions and Trade Associations'),
 ('topic_244b7e129f2af5ed','subtheme_8072bf597cc1dc60','Business Finance and Industrial Relations'),
 ('topic_9004ca2f04f660e5','subtheme_a08a589b8c4c9f89','International Trade and Trade Terms'),
 ('topic_8742d9fda3e8ffcb','subtheme_a08a589b8c4c9f89','Foreign Exchange, Taxation and Trade Regulation'),
 ('topic_9c5c57b28d63f7d2','subtheme_c6d2623b20fb3661','Marketing, Promotion and Market Research'),
 ('topic_98ab5e920a50fd43','subtheme_a0085c91b147f1b9','Consumer Protection and Product Standards')
)
insert into public.topics(subject_id,class_id,term_id,name,is_active,curriculum_id,curriculum_subtheme_id,curriculum_verification_status,curriculum_source_document,curriculum_source_pages)
select 'd319d302-334b-4eb4-b403-b46f7a794a09'::uuid,null,null,name,true,curriculum_id,curriculum_subtheme_id,'review_required','data/legacy-question-bank.ts','{}'::integer[] from seed
on conflict(curriculum_id) do update set name=excluded.name,curriculum_subtheme_id=excluded.curriculum_subtheme_id,curriculum_verification_status=excluded.curriculum_verification_status,curriculum_source_document=excluded.curriculum_source_document,curriculum_source_pages=excluded.curriculum_source_pages,is_active=true,updated_at=now();

do $$ begin
 if (select count(*) from public.curriculum_themes where subject_id='d319d302-334b-4eb4-b403-b46f7a794a09')<>4 then raise exception 'Expected four Commerce themes'; end if;
 if (select count(*) from public.curriculum_subthemes cs join public.curriculum_themes ct on ct.id=cs.theme_id where ct.subject_id='d319d302-334b-4eb4-b403-b46f7a794a09')<>8 then raise exception 'Expected eight Commerce subthemes'; end if;
 if (select count(*) from public.topics where subject_id='d319d302-334b-4eb4-b403-b46f7a794a09')<>12 then raise exception 'Expected twelve Commerce topics'; end if;
end $$;
