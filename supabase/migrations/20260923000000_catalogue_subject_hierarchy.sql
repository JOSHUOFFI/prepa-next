-- Add level/field metadata to the catalogue layer so the UI can render
-- JSS and SS subject groups without changing production subjects, questions,
-- topics, or exam history.

alter table public.catalogue_subjects
  add column if not exists education_level text,
  add column if not exists subject_field text;

alter table public.catalogue_subjects
  add constraint catalogue_subjects_education_level_check
  check (education_level is null or education_level in ('jss', 'sss'));

alter table public.catalogue_subjects
  add constraint catalogue_subjects_subject_field_check
  check (
    subject_field is null or subject_field in (
      'core_general',
      'religion',
      'language',
      'trade_vocational',
      'core_compulsory',
      'science',
      'arts_humanities',
      'commercial_business'
    )
  );

update public.catalogue_subjects
set education_level = 'jss',
    subject_field = case catalogue_key
      when 'english_studies' then 'core_general'
      when 'mathematics' then 'core_general'
      when 'intermediate_science' then 'core_general'
      when 'physical_health_education' then 'core_general'
      when 'digital_technologies' then 'core_general'
      when 'nigerian_history' then 'core_general'
      when 'social_citizenship_studies' then 'core_general'
      when 'cultural_creative_arts' then 'core_general'
      when 'business_studies' then 'core_general'
      when 'hausa' then 'language'
      when 'igbo' then 'language'
      when 'yoruba' then 'language'
      when 'christian_religious_studies' then 'religion'
      when 'islamic_studies' then 'religion'
      when 'french' then 'language'
      when 'arabic_language' then 'language'
      when 'solar_photovoltaic_installation_maintenance' then 'trade_vocational'
      when 'fashion_design_garment_making' then 'trade_vocational'
      when 'livestock_farming' then 'trade_vocational'
      when 'beauty_cosmetology' then 'trade_vocational'
      when 'computer_hardware_gsm_repairs' then 'trade_vocational'
      when 'horticulture_crop_production' then 'trade_vocational'
      else subject_field
    end
where education_level is null or subject_field is null;

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
  sort_order,
  education_level,
  subject_field,
  is_active
)
values
  ('english_language', 'English Language', 'core_academic', 'a0e64f96-d382-4cee-9f84-b1e6b5e075c6', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'ENGLISH_LANGUAGE', 'Senior Secondary core/compulsory subject', 23, 'sss', 'core_compulsory', true),
  ('general_mathematics', 'General Mathematics', 'core_academic', '91f37d59-3401-47c5-ae18-46ead707c570', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'GENERAL_MATHEMATICS', 'Senior Secondary core/compulsory subject', 24, 'sss', 'core_compulsory', true),
  ('citizenship_heritage_studies', 'Citizenship & Heritage Studies', 'core_academic', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'CITIZENSHIP_HERITAGE_STUDIES', 'Core subject under SS; no approved production mapping', 25, 'sss', 'core_compulsory', true),
  ('digital_technologies_ss', 'Digital Technologies', 'core_academic', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'DIGITAL_TECHNOLOGIES', 'Senior Secondary core/compulsory subject', 26, 'sss', 'core_compulsory', true),
  ('trade_subject', 'Trade Subject', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'TRADE_SUBJECT', 'Senior Secondary core/compulsory placeholder; subject-specific trade identity remains unresolved', 27, 'sss', 'core_compulsory', true),
  ('biology', 'Biology', 'core_academic', 'bb3d3ab5-ba77-47f5-967d-0b850e406480', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'BIOLOGY', 'Senior Secondary science subject', 28, 'sss', 'science', true),
  ('chemistry', 'Chemistry', 'core_academic', '46a1093b-2ac5-4e2b-835b-f009a72cb359', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'CHEMISTRY', 'Senior Secondary science subject', 29, 'sss', 'science', true),
  ('physics', 'Physics', 'core_academic', '1812a3d8-cfb8-4564-ae3b-5611c8c2357c', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'PHYSICS', 'Senior Secondary science subject', 30, 'sss', 'science', true),
  ('agricultural_science', 'Agricultural Science', 'core_academic', 'ab79e100-9e4c-4a9e-b952-19df15b2443c', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'AGRICULTURAL_SCIENCE', 'Senior Secondary science subject', 31, 'sss', 'science', true),
  ('further_mathematics', 'Further Mathematics', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'FURTHER_MATHEMATICS', 'Senior Secondary science subject; no approved production mapping', 32, 'sss', 'science', true),
  ('geography', 'Geography', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'GEOGRAPHY', 'Senior Secondary science subject; no approved production mapping', 33, 'sss', 'science', true),
  ('technical_drawing', 'Technical Drawing', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'TECHNICAL_DRAWING', 'Senior Secondary science subject; no approved production mapping', 34, 'sss', 'science', true),
  ('physical_education_ss', 'Physical Education', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'PHYSICAL_EDUCATION', 'Senior Secondary science subject; no approved production mapping', 35, 'sss', 'science', true),
  ('health_education', 'Health Education', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'HEALTH_EDUCATION', 'Senior Secondary science subject; no approved production mapping', 36, 'sss', 'science', true),
  ('foods_nutrition', 'Foods & Nutrition', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'FOODS_NUTRITION', 'Senior Secondary science subject; no approved production mapping', 37, 'sss', 'science', true),
  ('government', 'Government', 'core_academic', 'd9dabed8-efa8-46fb-9637-ca4c30caa97d', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'GOVERNMENT', 'Senior Secondary arts/humanities subject', 38, 'sss', 'arts_humanities', true),
  ('nigerian_history_ss', 'Nigerian History', 'core_academic', '41fcf4c5-0a9b-4486-8de6-b98fe1c2c412', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'NIGERIAN_HISTORY', 'Senior Secondary arts/humanities subject; preserves History UUID', 39, 'sss', 'arts_humanities', true),
  ('literature_in_english', 'Literature in English', 'core_academic', '91f5f142-acbf-42bb-b85e-c58ef9d15d54', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'LITERATURE_IN_ENGLISH', 'Senior Secondary arts/humanities subject', 40, 'sss', 'arts_humanities', true),
  ('christian_religious_studies_ss', 'Christian Religious Studies', 'religion', '5e4ff239-fd12-4765-b035-70ea77ecee6c', 'MAP_EXISTING', 'mapped_no_questions', 'religion', 'applicable_option', 'CRS', 'Senior Secondary arts/humanities subject', 41, 'sss', 'arts_humanities', true),
  ('islamic_studies_ss', 'Islamic Studies', 'religion', null, 'NEW_CATALOGUE_IDENTITY', 'source_review_required', 'religion', 'applicable_option', 'ISLAMIC_RELIGIOUS_STUDIES', 'Senior Secondary arts/humanities subject', 42, 'sss', 'arts_humanities', true),
  ('hausa_ss', 'Hausa', 'nigerian_language', null, 'UNRESOLVED', 'source_review_required', 'nigerian_language', 'exactly_one', 'HAUSA', 'Senior Secondary arts/humanities language option', 43, 'sss', 'arts_humanities', true),
  ('igbo_ss', 'Igbo', 'nigerian_language', null, 'UNRESOLVED', 'source_review_required', 'nigerian_language', 'exactly_one', 'IGBO', 'Senior Secondary arts/humanities language option', 44, 'sss', 'arts_humanities', true),
  ('yoruba_ss', 'Yoruba', 'nigerian_language', null, 'UNRESOLVED', 'source_review_required', 'nigerian_language', 'exactly_one', 'YORUBA', 'Senior Secondary arts/humanities language option', 45, 'sss', 'arts_humanities', true),
  ('french_ss', 'French', 'core_academic', null, 'NEW_CATALOGUE_IDENTITY', 'source_review_required', null, 'independent', 'FRENCH', 'Senior Secondary arts/humanities language option', 46, 'sss', 'arts_humanities', true),
  ('arabic_language_ss', 'Arabic Language', 'core_academic', null, 'UNRESOLVED', 'source_review_required', null, 'independent', 'ARABIC', 'Senior Secondary arts/humanities language option', 47, 'sss', 'arts_humanities', true),
  ('visual_arts', 'Visual Arts', 'core_academic', null, 'NEW_CATALOGUE_IDENTITY', 'mapping_required', null, 'independent', 'VISUAL_ARTS', 'Senior Secondary arts/humanities subject', 48, 'sss', 'arts_humanities', true),
  ('music', 'Music', 'core_academic', null, 'NEW_CATALOGUE_IDENTITY', 'mapping_required', null, 'independent', 'MUSIC', 'Senior Secondary arts/humanities subject', 49, 'sss', 'arts_humanities', true),
  ('home_management', 'Home Management', 'core_academic', null, 'NEW_CATALOGUE_IDENTITY', 'mapping_required', null, 'independent', 'HOME_MANAGEMENT', 'Senior Secondary arts/humanities subject', 50, 'sss', 'arts_humanities', true),
  ('catering_craft', 'Catering Craft', 'core_academic', null, 'NEW_CATALOGUE_IDENTITY', 'mapping_required', null, 'independent', 'CATERING_CRAFT', 'Senior Secondary arts/humanities subject', 51, 'sss', 'arts_humanities', true),
  ('accounting', 'Accounting', 'core_academic', '1696fc62-d7e6-4547-a01f-f140644ef1b8', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'ACCOUNTING', 'Senior Secondary commercial/business subject', 52, 'sss', 'commercial_business', true),
  ('commerce', 'Commerce', 'core_academic', 'd319d302-334b-4eb4-b403-b46f7a794a09', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'COMMERCE', 'Senior Secondary commercial/business subject', 53, 'sss', 'commercial_business', true),
  ('economics', 'Economics', 'core_academic', 'a55ad82b-4630-491b-ae8d-76613c147d27', 'MAP_EXISTING', 'mapped_no_questions', null, 'independent', 'ECONOMICS', 'Senior Secondary commercial/business subject', 54, 'sss', 'commercial_business', true),
  ('marketing', 'Marketing', 'core_academic', null, 'NEW_CATALOGUE_IDENTITY', 'mapping_required', null, 'independent', 'MARKETING', 'Senior Secondary commercial/business subject', 55, 'sss', 'commercial_business', true),
  ('solar_photovoltaic_installation_maintenance_ss', 'Solar Photovoltaic Installation & Maintenance', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'SOLAR_PHOTOVOLTAIC_INSTALLATION_MAINTENANCE', 'Senior Secondary trade/vocational subject', 56, 'sss', 'trade_vocational', true),
  ('fashion_design_garment_making_ss', 'Fashion Design & Garment Making', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'FASHION_DESIGN_GARMENT_MAKING', 'Senior Secondary trade/vocational subject', 57, 'sss', 'trade_vocational', true),
  ('livestock_farming_ss', 'Livestock Farming', 'core_academic', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'PREVOC', 'Senior Secondary trade/vocational subject', 58, 'sss', 'trade_vocational', true),
  ('beauty_cosmetology_ss', 'Beauty & Cosmetology', 'core_academic', null, 'UNRESOLVED', 'not_ready', null, 'independent', 'BEAUTY_COSMETOLOGY', 'Senior Secondary trade/vocational subject', 59, 'sss', 'trade_vocational', true),
  ('computer_hardware_gsm_repairs_ss', 'Computer Hardware & GSM Repairs', 'core_academic', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'BASIC_TECHNOLOGY', 'Senior Secondary trade/vocational subject', 60, 'sss', 'trade_vocational', true),
  ('horticulture_crop_production_ss', 'Horticulture & Crop Production', 'core_academic', null, 'UNRESOLVED', 'scope_decision_required', null, 'independent', 'PREVOC', 'Senior Secondary trade/vocational subject', 61, 'sss', 'trade_vocational', true)
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
  education_level = excluded.education_level,
  subject_field = excluded.subject_field,
  is_active = excluded.is_active,
  updated_at = now();

-- One-time safety check: catalogue must remain additive and production-owned.
do $$
begin
  if (select count(*) from public.catalogue_subjects where education_level = 'sss') < 1 then
    raise exception 'Senior secondary catalogue rows were not created';
  end if;
end
$$;
