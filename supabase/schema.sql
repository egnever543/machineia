create table products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text not null,
  pain_points text,
  target_audience text,
  price text,
  checkout_url text not null,
  created_at timestamptz default now()
);

create table prompt_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products not null,
  system_prompt text not null,
  cta_text text not null default 'Quero garantir meu acesso',
  cta_trigger_message int not null default 5,
  is_active boolean default false,
  created_at timestamptz default now(),
  notes text
);

create table hypotheses (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products not null,
  description text not null,
  type text not null,
  status text default 'testing',
  confirmations_needed int default 10,
  confirmations_count int default 0,
  created_at timestamptz default now()
);

create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products not null,
  prompt_version_id uuid references prompt_versions,
  visitor_id text,
  cta_shown boolean default false,
  cta_shown_at_message int,
  cta_clicked boolean default false,
  session_ended boolean default false,
  message_count int default 0,
  created_at timestamptz default now(),
  ended_at timestamptz
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions not null,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table products enable row level security;
alter table prompt_versions enable row level security;
alter table hypotheses enable row level security;
alter table chat_sessions enable row level security;
alter table messages enable row level security;

create policy "owner access" on products for all using (auth.uid() = user_id);
create policy "public insert sessions" on chat_sessions for insert with check (true);
create policy "public insert messages" on messages for insert with check (true);
create policy "public select messages" on messages for select using (true);
create policy "public update sessions" on chat_sessions for update using (true);
create policy "owner read sessions" on chat_sessions for select using (product_id in (select id from products where user_id = auth.uid()));
create policy "owner access prompts" on prompt_versions for all using (product_id in (select id from products where user_id = auth.uid()));
create policy "public read active prompt" on prompt_versions for select using (is_active = true);
create policy "owner access hypotheses" on hypotheses for all using (product_id in (select id from products where user_id = auth.uid()));
