create table charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  category text,
  featured boolean default false,
  events jsonb default '[]'::jsonb,   
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'subscriber' check (role in ('subscriber', 'admin')),
  charity_id uuid references charities(id) on delete set null,
  charity_percent int not null default 10 check (charity_percent between 10 and 100),
  created_at timestamptz default now()
);

create table subscriptions (
  user_id uuid primary key references profiles(id) on delete cascade,
  plan text check (plan in ('monthly', 'yearly')),
  status text default 'lapsed' check (status in ('active', 'lapsed', 'cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  score int not null check (score between 1 and 45),
  played_on date not null,
  created_at timestamptz default now(),
  unique (user_id, played_on)           -- one score per date
);
create index on scores (user_id, played_on desc);

create table draws (
  id uuid primary key default gen_random_uuid(),
  month text unique not null,           -- 'YYYY-MM'
  mode text check (mode in ('random', 'algorithmic')),
  numbers int[] not null,
  status text default 'published' check (status in ('simulated', 'published')),
  pool_total numeric default 0,
  tier5_pool numeric default 0,
  tier4_pool numeric default 0,
  tier3_pool numeric default 0,
  jackpot_in numeric default 0,
  jackpot_out numeric default 0,
  subscriber_count int default 0,
  published_at timestamptz
);

create table draw_entries (
  draw_id uuid references draws(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  scores int[] not null,
  primary key (draw_id, user_id)
);

create table winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid references draws(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  match_count int check (match_count between 3 and 5),
  prize numeric not null,
  proof_url text,                       -- storage path inside the private "proofs" bucket
  verify_status text default 'pending' check (verify_status in ('pending', 'approved', 'rejected')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  charity_id uuid references charities(id) on delete set null,
  amount numeric not null,
  stripe_session_id text unique,
  created_at timestamptz default now()
);
alter table charities enable row level security;
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table scores enable row level security;
alter table draws enable row level security;
alter table draw_entries enable row level security;
alter table winners enable row level security;
alter table donations enable row level security;

create policy "public read charities" on charities for select using (true);
create policy "public read draws" on draws for select using (true);
create policy "own profile" on profiles for select using (auth.uid() = id);
create policy "own scores" on scores for select using (auth.uid() = user_id);
create policy "own subscription" on subscriptions for select using (auth.uid() = user_id);
create policy "own winnings" on winners for select using (auth.uid() = user_id);

create or replace function eligible_entries()
returns table (user_id uuid, plan text, scores int[])
language sql stable as $$
  select s.user_id, s.plan, array_agg(sc.score order by sc.played_on desc) as scores
  from subscriptions s
  join scores sc on sc.user_id = s.user_id
  where s.status = 'active' and s.current_period_end > now()
  group by s.user_id, s.plan
  having count(*) = 5
  order by s.user_id;
$$;

create or replace function publish_draw(p_draw jsonb, p_entries jsonb, p_winners jsonb)
returns uuid
language plpgsql as $$
declare v_id uuid;
begin
  insert into draws (month, mode, numbers, status, pool_total, tier5_pool, tier4_pool, tier3_pool,
                     jackpot_in, jackpot_out, subscriber_count, published_at)
  values (
    p_draw->>'month', p_draw->>'mode',
    array(select (x)::int from jsonb_array_elements_text(p_draw->'numbers') x),
    'published',
    (p_draw->>'pool_total')::numeric, (p_draw->>'tier5_pool')::numeric,
    (p_draw->>'tier4_pool')::numeric, (p_draw->>'tier3_pool')::numeric,
    (p_draw->>'jackpot_in')::numeric, (p_draw->>'jackpot_out')::numeric,
    (p_draw->>'subscriber_count')::int, now()
  ) returning id into v_id;

  insert into draw_entries (draw_id, user_id, scores)
  select v_id, (e->>'user_id')::uuid, array(select (x)::int from jsonb_array_elements_text(e->'scores') x)
  from jsonb_array_elements(p_entries) e;

  insert into winners (draw_id, user_id, match_count, prize)
  select v_id, (w->>'user_id')::uuid, (w->>'match_count')::int, (w->>'prize')::numeric
  from jsonb_array_elements(p_winners) w;

  return v_id;
end $$;

revoke execute on function eligible_entries() from public, anon, authenticated;
revoke execute on function publish_draw(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function eligible_entries() to service_role;
grant execute on function publish_draw(jsonb, jsonb, jsonb) to service_role;
