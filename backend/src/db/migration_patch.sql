
alter table winners add column if not exists paid_at timestamptz;

alter table profiles drop constraint if exists profiles_charity_fk;
alter table profiles add constraint profiles_charity_fk
  foreign key (charity_id) references charities(id) on delete set null;

alter table subscriptions drop constraint if exists subscriptions_status_check;
alter table subscriptions add constraint subscriptions_status_check
  check (status in ('active', 'lapsed', 'cancelled'));

create table if not exists draw_entries (
  draw_id uuid references draws(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  scores int[] not null,
  primary key (draw_id, user_id)
);

create table if not exists donations (
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

drop policy if exists "public read charities" on charities;
drop policy if exists "public read draws" on draws;
drop policy if exists "own profile" on profiles;
drop policy if exists "own scores" on scores;
drop policy if exists "own subscription" on subscriptions;
drop policy if exists "own winnings" on winners;
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
