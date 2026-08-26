alter table public.profiles
  add column custom_instructions text not null default ''
  check (char_length(custom_instructions) <= 10000);
