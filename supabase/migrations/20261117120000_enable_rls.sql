-- Keep direct API access to application tables denied unless an explicit,
-- least-privilege policy is added. The backend uses the service-role key,
-- which bypasses RLS for its server-side repository operations.
alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.activities enable row level security;
alter table public.join_requests enable row level security;
