-- Voice transcription & summaries
alter table voice_records add column if not exists transcript text;
alter table voice_records add column if not exists summary text;

-- Document search / classification
alter table documents add column if not exists content_text text;
alter table documents add column if not exists category text;
alter table documents add column if not exists summary text;

-- Agent run output
alter table agents add column if not exists last_output text;
