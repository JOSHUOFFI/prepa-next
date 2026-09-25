-- Phase 2F: Literature in English curriculum foundation.  No questions change.
do $$ begin
  if not exists (select 1 from public.subjects where id = '91f5f142-acbf-42bb-b85e-c58ef9d15d54' and name = 'Literature' and slug = 'literature' and is_active) then raise exception 'Canonical Literature subject guard failed'; end if;
  if (select count(*) from public.classes where name in ('SS1', 'SS2')) <> 2 then raise exception 'SS class guard failed'; end if;
end $$;

with seed(class_name,name) as (values
 ('SS1','Literary Foundations and Appreciation'),('SS1','Literary Devices and Style'),('SS1','Prose Fiction'),
 ('SS2','Poetry'),('SS2','Drama'),('SS2','African, Nigerian and World Literature')
), p as (select 'theme_'||substr(md5('literature-in-english|'||class_name||'|'||name),1,16) id,'91f5f142-acbf-42bb-b85e-c58ef9d15d54'::uuid subject_id,(select id from public.classes where name=class_name) class_id,name from seed)
insert into public.curriculum_themes(id,subject_id,class_id,name,verification_status,source_document,source_pages)
select id,subject_id,class_id,name,'review_required','data/legacy-question-bank.ts','{}'::integer[] from p
on conflict(id) do update set name=excluded.name,verification_status=excluded.verification_status,source_document=excluded.source_document,source_pages=excluded.source_pages,updated_at=now();

with seed(class_name,theme_name,name) as (values
 ('SS1','Literary Foundations and Appreciation','Nature, Functions and Forms of Literature'),('SS1','Literary Foundations and Appreciation','Reading, Interpretation and Literary Context'),
 ('SS1','Literary Devices and Style','Figurative Language, Imagery and Symbolism'),('SS1','Literary Devices and Style','Narrative Technique, Diction and Style'),
 ('SS1','Prose Fiction','Elements of Prose Fiction'),('SS1','Prose Fiction','Prose Forms, Themes and Analysis'),
 ('SS2','Poetry','Poetic Forms, Rhyme and Rhythm'),('SS2','Poetry','Poetic Language, Structure and Interpretation'),
 ('SS2','Drama','Elements and Structure of Drama'),('SS2','Drama','Dramatic Technique, Dialogue and Stagecraft'),
 ('SS2','African, Nigerian and World Literature','African and Nigerian Literary Traditions'),('SS2','African, Nigerian and World Literature','World Literature, Movements and Major Works')
), p as (select 'subtheme_'||substr(md5('literature-in-english|'||class_name||'|'||theme_name||'|'||name),1,16) id,'theme_'||substr(md5('literature-in-english|'||class_name||'|'||theme_name),1,16) theme_id,name from seed)
insert into public.curriculum_subthemes(id,theme_id,name,verification_status,source_document,source_pages)
select id,theme_id,name,'review_required','data/legacy-question-bank.ts','{}'::integer[] from p
on conflict(id) do update set name=excluded.name,verification_status=excluded.verification_status,source_document=excluded.source_document,source_pages=excluded.source_pages,updated_at=now();

with seed(class_name,theme_name,subtheme_name,name) as (values
 ('SS1','Literary Foundations and Appreciation','Nature, Functions and Forms of Literature','Meaning, Scope and Functions of Literature'),('SS1','Literary Foundations and Appreciation','Nature, Functions and Forms of Literature','Literary Genres and Forms'),
 ('SS1','Literary Foundations and Appreciation','Reading, Interpretation and Literary Context','Theme, Context and Literary Interpretation'),('SS1','Literary Foundations and Appreciation','Reading, Interpretation and Literary Context','Literary Criticism and Comparative Appreciation'),
 ('SS1','Literary Devices and Style','Figurative Language, Imagery and Symbolism','Figures of Speech'),('SS1','Literary Devices and Style','Figurative Language, Imagery and Symbolism','Imagery, Symbolism, Tone and Mood'),
 ('SS1','Literary Devices and Style','Narrative Technique, Diction and Style','Point of View, Diction and Style'),('SS1','Literary Devices and Style','Narrative Technique, Diction and Style','Characterisation, Setting and Plot Structure'),
 ('SS1','Prose Fiction','Elements of Prose Fiction','Character, Setting and Conflict in Prose'),('SS1','Prose Fiction','Elements of Prose Fiction','Plot, Theme and Narrative Perspective'),
 ('SS1','Prose Fiction','Prose Forms, Themes and Analysis','Novel, Novella and Short Story'),('SS1','Prose Fiction','Prose Forms, Themes and Analysis','Prose Analysis and Social Context'),
 ('SS2','Poetry','Poetic Forms, Rhyme and Rhythm','Types and Forms of Poetry'),('SS2','Poetry','Poetic Forms, Rhyme and Rhythm','Rhyme, Rhythm and Sound Devices'),
 ('SS2','Poetry','Poetic Language, Structure and Interpretation','Stanza, Meter and Poetic Structure'),('SS2','Poetry','Poetic Language, Structure and Interpretation','Poetic Imagery, Tone and Interpretation'),
 ('SS2','Drama','Elements and Structure of Drama','Character, Conflict and Plot in Drama'),('SS2','Drama','Elements and Structure of Drama','Tragedy, Comedy and Dramatic Forms'),
 ('SS2','Drama','Dramatic Technique, Dialogue and Stagecraft','Dialogue, Soliloquy and Aside'),('SS2','Drama','Dramatic Technique, Dialogue and Stagecraft','Stagecraft, Dramatic Irony and Audience'),
 ('SS2','African, Nigerian and World Literature','African and Nigerian Literary Traditions','African Oral and Written Literary Traditions'),('SS2','African, Nigerian and World Literature','African and Nigerian Literary Traditions','Nigerian Writers, Works and Cultural Context'),
 ('SS2','African, Nigerian and World Literature','World Literature, Movements and Major Works','World Authors, Works and Literary Periods'),('SS2','African, Nigerian and World Literature','World Literature, Movements and Major Works','Literary Movements and Modern Literature')
), p as (select 'topic_'||substr(md5('literature-in-english|'||class_name||'|'||theme_name||'|'||subtheme_name||'|'||name),1,16) curriculum_id,'subtheme_'||substr(md5('literature-in-english|'||class_name||'|'||theme_name||'|'||subtheme_name),1,16) curriculum_subtheme_id,name from seed)
insert into public.topics(subject_id,class_id,term_id,name,is_active,curriculum_id,curriculum_subtheme_id,curriculum_verification_status,curriculum_source_document,curriculum_source_pages)
select '91f5f142-acbf-42bb-b85e-c58ef9d15d54'::uuid,null,null,name,true,curriculum_id,curriculum_subtheme_id,'review_required','data/legacy-question-bank.ts','{}'::integer[] from p
on conflict(curriculum_id) do update set name=excluded.name,curriculum_subtheme_id=excluded.curriculum_subtheme_id,curriculum_verification_status=excluded.curriculum_verification_status,curriculum_source_document=excluded.curriculum_source_document,curriculum_source_pages=excluded.curriculum_source_pages,is_active=true,updated_at=now();

do $$ begin
 if (select count(*) from public.curriculum_themes where subject_id='91f5f142-acbf-42bb-b85e-c58ef9d15d54')<>6 then raise exception 'Expected six Literature themes'; end if;
 if (select count(*) from public.curriculum_subthemes cs join public.curriculum_themes ct on ct.id=cs.theme_id where ct.subject_id='91f5f142-acbf-42bb-b85e-c58ef9d15d54')<>12 then raise exception 'Expected twelve Literature subthemes'; end if;
 if (select count(*) from public.topics where subject_id='91f5f142-acbf-42bb-b85e-c58ef9d15d54')<>24 then raise exception 'Expected twenty-four Literature topics'; end if;
end $$;
