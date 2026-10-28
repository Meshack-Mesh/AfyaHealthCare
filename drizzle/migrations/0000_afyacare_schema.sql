create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.user_language as enum ('en', 'sw');
create type public.content_status as enum ('draft', 'reviewed', 'published');
create type public.reminder_type as enum ('immunization', 'clinic_visit');
create type public.reminder_status as enum ('pending', 'sent', 'cancelled');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view own roles"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create table public.ussd_users (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null unique,
  language public.user_language not null default 'en',
  consent_given boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ussd_sessions (
  id text primary key,
  phone_number text not null,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.ussd_users to authenticated;
grant all on public.ussd_users to service_role;
grant select on public.ussd_sessions to authenticated;
grant all on public.ussd_sessions to service_role;

alter table public.ussd_users enable row level security;
alter table public.ussd_sessions enable row level security;

create policy "Admins can view USSD users"
on public.ussd_users for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view USSD sessions"
on public.ussd_sessions for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create table public.health_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_sw text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.health_content (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.health_categories(id) on delete cascade not null,
  title_en text not null,
  title_sw text not null,
  body_en text not null,
  body_sw text not null,
  status public.content_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.health_categories to anon;
grant select, insert, update, delete on public.health_categories to authenticated;
grant all on public.health_categories to service_role;
grant select on public.health_content to anon;
grant select, insert, update, delete on public.health_content to authenticated;
grant all on public.health_content to service_role;

alter table public.health_categories enable row level security;
alter table public.health_content enable row level security;

create policy "Anyone can view health categories"
on public.health_categories for select to anon, authenticated using (true);

create policy "Anyone can view published content"
on public.health_content for select to anon, authenticated using (true);

create policy "Admins manage categories"
on public.health_categories for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage content"
on public.health_content for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create table public.healthcare_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  county text not null,
  location text not null,
  services text not null,
  phone text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.healthcare_providers to anon;
grant select, insert, update, delete on public.healthcare_providers to authenticated;
grant all on public.healthcare_providers to service_role;

alter table public.healthcare_providers enable row level security;

create policy "Anyone can view providers"
on public.healthcare_providers for select to anon, authenticated using (true);

create policy "Admins manage providers"
on public.healthcare_providers for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  ussd_user_id uuid references public.ussd_users(id) on delete cascade not null,
  reminder_type public.reminder_type not null,
  due_date date,
  status public.reminder_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  ussd_user_id uuid references public.ussd_users(id) on delete cascade not null,
  purpose text not null,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

grant select, update, delete on public.reminders to authenticated;
grant all on public.reminders to service_role;
grant select on public.consent_records to authenticated;
grant all on public.consent_records to service_role;

alter table public.reminders enable row level security;
alter table public.consent_records enable row level security;

create policy "Admins view reminders"
on public.reminders for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins update reminders"
on public.reminders for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete reminders"
on public.reminders for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins view consent records"
on public.consent_records for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

insert into public.health_categories (slug, name_en, name_sw, sort_order) values
  ('reproductive-health', 'Reproductive Health', 'Afya ya Uzazi', 1),
  ('nutrition', 'Nutrition', 'Lishe', 2),
  ('breastfeeding', 'Breastfeeding', 'Kunyonyesha', 3),
  ('immunization', 'Immunization', 'Chanjo', 4),
  ('chronic-disease', 'Chronic Disease Support', 'Magonjwa ya Kudumu', 5);

insert into public.health_content (category_id, title_en, title_sw, body_en, body_sw, status, sort_order) values
((select id from public.health_categories where slug = 'reproductive-health'),
 'Family planning', 'Uzazi wa mpango',
 'Family planning helps you choose when to have children. Methods include pills, implants, injections and condoms. Visit a health facility to discuss the option that suits you best. A provider can help you choose safely.',
 'Uzazi wa mpango hukusaidia kuchagua wakati wa kupata watoto. Njia ni pamoja na vidonge, implants, sindano na kondomu. Tembelea kituo cha afya kupata ushauri unaofaa kwako. Mtoa huduma anaweza kukusaidia kuchagua kwa usalama.',
 'published', 1),
((select id from public.health_categories where slug = 'reproductive-health'),
 'Menstrual health', 'Afya ya hedhi',
 'A regular cycle is usually 21 to 35 days. Mild cramps are common, but severe pain, very heavy bleeding or missed periods deserve a check-up at a clinic. Use clean pads and change them regularly.',
 'Mzunguko wa kawaida ni siku 21 hadi 35. Maumivu mepesi ni ya kawaida, ila maumivu makali, kutokwa damu nyingi sana au hedhi kukosekana yanahitaji uchunguzi kwenye kliniki. Tumia nyeo safi na yabadilishe mara kwa mara.',
 'published', 2),
((select id from public.health_categories where slug = 'reproductive-health'),
 'When to see a health worker', 'Wakati wa kwenda kwa mhudumu wa afya',
 'See a health worker promptly for: severe lower belly pain, fever with unusual discharge, bleeding during pregnancy, or pain when urinating. Early care protects your health. This service gives information, not a diagnosis.',
 'Tembelea mhudumu wa afya haraka ikiwa una: maumivu makali ya tumbo la chini, homa na utokaji usio wa kawaida, kutokwa damu ujauzitonini, au maumivu wakati wa kukojoa. Huduma hii inatoa taarifa, sio utambuzi wa ugonjwa.',
 'published', 3),

((select id from public.health_categories where slug = 'nutrition'),
 'Balanced diet', 'Lishe yenye uwiano',
 'Eat a variety of foods: vegetables and fruits, whole grains like ugali made with whole maize flour, beans and other proteins, and only small amounts of oils and sugar. Drink clean, safe water every day.',
 'Kula vyakula mbalimbali: mboga na matunda, nafaka kamili kama ugali wa unga wa mahindi kamili, maharage na vyakula vingine vya protini, na kiasi kidogo tu cha mafuta na sukari. Kunywa maji safi na salama kila siku.',
 'published', 1),
((select id from public.health_categories where slug = 'nutrition'),
 'Nutrition during pregnancy', 'Lishe wakati wa ujauzito',
 'During pregnancy eat extra protein (eggs, beans, fish) and iron-rich foods (dark green vegetables, liver). Take iron and folic acid tablets as advised and attend all antenatal visits. Avoid alcohol, tobacco and raw foods.',
 'Wakati wa ujauzito kula protini zaidi (mayai, maharage, samaki) na vyakula tajiri wa ironi (mboga za majani ya kijani, ini). Kunywa vidonge vya ironi na folic acid kama ilivyoagizwa na hudhuria kliniki zote. Epuka pombe, sigara na vyakula ghafi.',
 'published', 2),
((select id from public.health_categories where slug = 'nutrition'),
 'Child nutrition', 'Lishe ya mtoto',
 'From 6 months, add mashed foods to breast milk: thick porridge, mashed vegetables, beans and eggs. Feed small amounts often, 2 to 3 times a day plus snacks. Keep meals clean and continue breastfeeding up to 2 years.',
 'Kuanzia mwezi wa 6, ongeza vyakula vilivyopondwa pamoja na kunyonyesha: uji mnene, mboga zilizopondwa, maharage na mayai. Lisha vipande vidogo mara 2 hadi 3 kwa siku pamoja na vitafunio. Endelea kunyonyesha hadi miaka 2.',
 'published', 3),

((select id from public.health_categories where slug = 'breastfeeding'),
 'Why breastfeed', 'Kunyonyesha ni muhimu',
 'Breast milk alone is all a baby needs for the first 6 months. It protects against illness and helps the brain grow. Start breastfeeding within one hour of birth and feed whenever the baby is hungry.',
 'Maziwa ya mama pekee yanatosha mtoto kwa miezi 6 ya kwanza. Yamlinda mtoto dhidi ya magonjwa na kumsaidia kukuwa akili. Anza kunyonyesha ndani ya saa moja baada ya kujifungua na nyonyesha mtoto akipenda.',
 'published', 1),
((select id from public.health_categories where slug = 'breastfeeding'),
 'Common challenges', 'Changamoto za kawaida',
 'Sore nipples: check that the baby takes most of the dark area into the mouth. Little milk: feed more often and rest. Painful swelling, fever or a blocked duct: visit a health facility for help.',
 'Vitupe vinavyouma: hakikisha mtoto anashika sehemu nyeusi nyingi kwenye mdomo. Maziwa kidogo: nyonyesha mara nyingi zaidi na pumzika. Uvimbe wenye maumivu, homa au duct iliyofungwa: tembelea kituo cha afya kwa msaada.',
 'published', 2),
((select id from public.health_categories where slug = 'breastfeeding'),
 'Working and breastfeeding', 'Kazi na kunyonyesha',
 'Express milk by hand or with a pump before work. A caregiver can feed it to your baby from a clean cup. Keep expressed milk in a cool place and use it within a few hours, or refrigerate for up to 3 days.',
 'Shona maziwa kwa mkono au kwa pomp kabla ya kazi. Mlezi anaweza kumlisha mtoto kwa kikombe safi. Hifadhi maziwa mahali penye baridi na yatumie ndani ya saa chache, au yahifadhi kwenye friji hadi siku 3.',
 'published', 3),

((select id from public.health_categories where slug = 'immunization'),
 'Why immunize', 'Umuhimu wa chanjo',
 'Vaccines protect your child from dangerous diseases like measles, polio and whooping cough. They are safe and free at public facilities. Complete every dose on schedule, even if your child seems healthy.',
 'Chanjo zamlinua watoto kutokana na magonjwa hatari kama surua, polio na kifaduro. Ni salama na bure katika vituo vya umma. Kamilisha dozi zote kwa ratiba, hata mtoto akiwa na afya njema.',
 'published', 1),
((select id from public.health_categories where slug = 'immunization'),
 'Immunization schedule', 'Ratiba ya chanjo',
 'Key visits: at birth (BCG, polio), at 6, 10 and 14 weeks (5-in-1, polio), and at 9 months (measles). Carry your child''s clinic card to every visit and ask the nurse which doses are due next.',
 'Tembeleo muhimu: siku ya kuzaliwa (BCG, polio), wiki 6, 10 na 14 (5-in-1, polio), na mwezi 9 (surua). Beba kadi ya kliniki ya mtoto kwenye tembeleo kila wakati na uliza muuguzi dozi zinazofuata.',
 'published', 2),
((select id from public.health_categories where slug = 'immunization'),
 'Missed doses', 'Dozi zilizokosekana',
 'If you miss a vaccine visit, go to the clinic as soon as possible. The schedule can continue where you left off. Do not restart from the beginning, and keep the clinic card safe.',
 'Ikiwa umekosa tembeleo la chanjo, nenda kliniki haraka iwezekanavyo. Ratiba inaweza kuendelea ulipoachia. Usianze upya kutoka mwanzo, na hifadhi kadi ya kliniki vizuri.',
 'published', 3),

((select id from public.health_categories where slug = 'chronic-disease'),
 'Living with diabetes', 'Kuishi na kisukari',
 'Diabetes can be managed: take medicine as prescribed, eat regular balanced meals, stay active and check your blood sugar as advised. Watch for warning signs such as extreme thirst, confusion or wounds that do not heal.',
 'Kisukari kinaweza kudhibitiwa: tumia dawa kama ilivyoagizwa, kula vyakula yenye uwiano kwa mpango, fanya mazoezi na pima sukari yako kama ilivyoagizwa. Angalia ishara za onyo kama kiu kali, mkanganyiko au majeraha yasiyopona.',
 'published', 1),
((select id from public.health_categories where slug = 'chronic-disease'),
 'Living with high blood pressure', 'Kuishi na shinikizo la damu',
 'High blood pressure often has no symptoms. Take your tablets daily even when you feel well, reduce salt, avoid smoking, walk regularly and attend check-ups. Sudden severe headache or chest pain needs care now.',
 'Shinikizo la damu mara nyingi halina dalili. Tumia vidonge vyako kila siku hata ukikaa vizuri, punguza chumvi, epuka sigara, tembea mara kwa mara na hudhuria uchunguzi. Maumivu makali ya kichwa au kifua yanahitaji huduma haraka.',
 'published', 2),
((select id from public.health_categories where slug = 'chronic-disease'),
 'Asthma care', 'Utunzaji wa pumu',
 'Use your reliever inhaler during attacks, and your preventer inhaler daily if prescribed. Avoid triggers like smoke, dust and cold air. If breathing is very hard, lips turn blue or speech is difficult, get emergency care.',
 'Tumia inhaler ya kutuliza wakati wa mashambulizi, na inhaler ya kuzuia kila siku kama ilivyoagizwa. Epuka visababishi kama moshi, vumbi na hewa ya baridi. Ikiwa upumuaji ni mgumu sana, mdomo unakuwa bluu au maneno ni magumu, pata huduma ya dharura.',
 'published', 3);

insert into public.healthcare_providers (name, county, location, services, phone, sort_order) values
  ('Kenyatta National Hospital', 'Nairobi', 'Upper Hill, Hospital Road', 'Emergency, Maternity, Immunization, Chronic disease clinic', '+254 20 2726300', 1),
  ('Mama Lucy Kibaki Hospital', 'Nairobi', 'Kayole', 'Outpatient, Maternity, Immunization', '+254 20 2067000', 2),
  ('Mbagathi County Hospital', 'Nairobi', 'Mbagathi Way', 'Outpatient, Maternity, Nutrition clinic', '+254 20 2725150', 3),
  ('Coast General Teaching and Referral Hospital', 'Mombasa', 'Mbarak Hinawy Road', 'Emergency, Maternity, Immunization, Chronic disease clinic', '+254 41 2314170', 4),
  ('Jaramogi Oginga Odinga Teaching and Referral Hospital', 'Kisumu', 'Kisumu-Kakamega Road', 'Emergency, Maternity, Immunization, Nutrition clinic', '+254 57 2022401', 5),
  ('Nakuru Level 5 Hospital', 'Nakuru', 'Section 58', 'Outpatient, Maternity, Immunization', '+254 51 2213000', 6);