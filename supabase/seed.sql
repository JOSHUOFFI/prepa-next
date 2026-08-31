insert into public.classes (name, slug, sort_order)
values
  ('JSS1', 'jss1', 1),
  ('JSS2', 'jss2', 2),
  ('JSS3', 'jss3', 3),
  ('SS1', 'ss1', 4),
  ('SS2', 'ss2', 5)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.terms (name, slug, sort_order)
values
  ('First Term', 'first-term', 1),
  ('Second Term', 'second-term', 2),
  ('Third Term', 'third-term', 3)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.subjects (name, slug, category)
values
  ('Mathematics', 'mathematics', 'Core Subjects'),
  ('English', 'english', 'Core Subjects'),
  ('Civic Education', 'civic-education', 'Core Subjects'),
  ('Basic Science', 'basic-science', 'Junior Secondary'),
  ('Basic Technology', 'basic-technology', 'Junior Secondary'),
  ('Social Studies', 'social-studies', 'Junior Secondary'),
  ('Business Studies', 'business-studies', 'Junior Secondary'),
  ('Biology', 'biology', 'Science'),
  ('Chemistry', 'chemistry', 'Science'),
  ('Physics', 'physics', 'Science'),
  ('Agricultural Science', 'agricultural-science', 'Science'),
  ('CRS', 'crs', 'Arts and Humanities'),
  ('Government', 'government', 'Arts and Humanities'),
  ('Literature', 'literature', 'Arts and Humanities'),
  ('History', 'history', 'Arts and Humanities'),
  ('Economics', 'economics', 'Commercial'),
  ('Commerce', 'commerce', 'Commercial'),
  ('Accounting', 'accounting', 'Commercial')
on conflict (slug) do update set name = excluded.name, category = excluded.category;