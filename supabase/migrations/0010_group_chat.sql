-- Group chat: a conversation can have more than one bot. `personas` holds the
-- full roster (null = solo chat, use the existing `persona` column as today).
-- `messages.persona` tags which bot said an assistant message (null = human,
-- or a solo chat's single bot).
alter table public.conversations
  add column personas text[];

alter table public.messages
  add column persona text;
