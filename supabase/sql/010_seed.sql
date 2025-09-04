-- Seed ~150 Kerala region leads with mixed sources/statuses
with src as (
  select unnest(array['Facebook','Instagram','Website','WalkIn','Referral','Other']) as source
), cities as (
  select unnest(array['Kochi','Thiruvananthapuram','Kozhikode','Thrissur','Kollam','Alappuzha','Kannur','Kottayam','Palakkad','Malappuram']) as city
), names as (
  select unnest(array[
    'Aarav','Vihaan','Aditya','Dhruv','Arjun','Ananya','Diya','Isha','Meera','Nila',
    'Anaya','Aisha','Neha','Kiran','Rahul','Ravi','Sneha','Rohit','Aparna','Varun',
    'Hari','Vivek','Anu','Akhil','Sanjay','Devika','Ammu','Lakshmi','Nandini','Arya']) as name
)
insert into public.leads (full_name, primary_phone, email, city, source, status, score, team_id)
select
  n.name || ' ' || to_char(g, 'FM00') as full_name,
  '91' || (7000000000 + (random()*1000000000)::bigint)::text as primary_phone,
  lower(replace(n.name,' ','')) || to_char(g, 'FM00') || '@example.com' as email,
  (select city from cities order by random() limit 1) as city,
  (select source from src order by random() limit 1)::lead_source as source,
  (array['NEW','CONTACTED','FOLLOW_UP','QUALIFIED','CONVERTED','LOST'])[1 + floor(random()*6)]::lead_status as status,
  40 + floor(random()*50)::int as score,
  null
from generate_series(1,150) g cross join names n
on conflict do nothing;

