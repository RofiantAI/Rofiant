-- The profile trigger only covers users created after 0001 was applied.
-- Backfill users that already existed so profile reads can keep their
-- one-auth-user-to-one-profile invariant.
insert into public.profiles (id, username)
select users.id, users.email
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.id = users.id
);
