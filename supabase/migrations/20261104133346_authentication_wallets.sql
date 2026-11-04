-- No payment endpoint is enabled. Only a trusted server can execute transaction RPCs.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 nickname text check (nickname is null or char_length(nickname) between 2 and 20),
 favorite_team text check (favorite_team in ('united','arsenal','liverpool','chelsea','city','common')),
 avatar_key integer check (avatar_key between 0 and 7),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wallets (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 balance bigint not null default 0 check (balance >= 0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wallet_ledger (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.wallets(user_id),
 delta bigint not null check (delta <> 0), reason text not null, reference_id uuid not null,
 idempotency_key text not null unique, created_at timestamptz not null default now()
);
create table public.payment_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.wallets(user_id),
 amount_vnd bigint not null check (amount_vnd > 0), coin_amount bigint not null check (coin_amount > 0),
 provider text not null, provider_reference text, status text not null default 'pending' check (status in ('pending','paid','failed','expired','refunded')),
 created_at timestamptz not null default now(), paid_at timestamptz,
 unique(provider, provider_reference)
);
create table public.shop_items (
 id text primary key, name text not null, description text not null default '',
 price_coins bigint not null check (price_coins > 0), effect_type text not null,
 duration_seconds integer check (duration_seconds > 0), is_active boolean not null default true
);
create table public.purchases (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.wallets(user_id),
 item_id text not null references public.shop_items(id), price_paid bigint not null check (price_paid > 0),
 status text not null default 'owned' check (status in ('owned','used','expired','refunded')),
 created_at timestamptz not null default now(), expires_at timestamptz,
 idempotency_key text not null, unique(user_id, idempotency_key)
);
create index ledger_user_time on public.wallet_ledger(user_id, created_at desc);
create index orders_user_time on public.payment_orders(user_id, created_at desc);
create index purchases_user_time on public.purchases(user_id, created_at desc);
create index purchases_item on public.purchases(item_id);

create function private.initialize_player() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id) values (new.id) on conflict do nothing;
 insert into public.wallets(user_id) values (new.id) on conflict do nothing;
 return new;
end $$;
revoke all on function private.initialize_player() from public, anon, authenticated;
create trigger initialize_player after insert on auth.users for each row execute function private.initialize_player();
-- Also supports users that existed before installing this migration.
insert into public.profiles(id) select id from auth.users on conflict do nothing;
insert into public.wallets(user_id) select id from public.profiles on conflict do nothing;
create function private.touch_profile() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
revoke all on function private.touch_profile() from public, anon, authenticated;
create trigger touch_profile before update on public.profiles for each row execute function private.touch_profile();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.payment_orders enable row level security;
alter table public.shop_items enable row level security;
alter table public.purchases enable row level security;
revoke all on public.profiles, public.wallets, public.wallet_ledger, public.payment_orders, public.shop_items, public.purchases from anon, authenticated;
grant select on public.profiles, public.wallets, public.wallet_ledger, public.payment_orders, public.shop_items, public.purchases to authenticated;
grant update(nickname, favorite_team, avatar_key) on public.profiles to authenticated;
grant all on public.profiles, public.wallets, public.wallet_ledger, public.payment_orders, public.shop_items, public.purchases to service_role;
create policy own_profile_read on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy own_profile_edit on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy own_wallet on public.wallets for select to authenticated using ((select auth.uid()) = user_id);
create policy own_ledger on public.wallet_ledger for select to authenticated using ((select auth.uid()) = user_id);
create policy own_orders on public.payment_orders for select to authenticated using ((select auth.uid()) = user_id);
create policy own_purchases on public.purchases for select to authenticated using ((select auth.uid()) = user_id);
create policy active_shop on public.shop_items for select to authenticated using (is_active);

-- SECURITY INVOKER: callable only by service_role, which holds the table privileges.
-- The server derives p_user from getUser(accessToken); never from request JSON.
create function public.purchase_item(p_user uuid, p_item text, p_key text) returns public.purchases
language plpgsql security invoker set search_path = '' as $$
declare item public.shop_items; existing public.purchases; result public.purchases;
begin
 if p_key is null or char_length(p_key) not between 8 and 128 then raise exception 'INVALID_KEY'; end if;
 if not exists(select 1 from auth.users where id = p_user and is_anonymous is false and (email_confirmed_at is not null or phone_confirmed_at is not null or exists (select 1 from auth.identities where user_id = p_user and provider in ('google','facebook')))) then raise exception 'LINKED_ACCOUNT_REQUIRED'; end if;
 perform 1 from public.wallets where user_id = p_user for update;
 if not found then raise exception 'WALLET_MISSING'; end if;
 select * into existing from public.purchases where user_id = p_user and idempotency_key = p_key;
 if found then
  if existing.item_id <> p_item then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return existing;
 end if;
 select * into item from public.shop_items where id = p_item and is_active for share;
 if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
 update public.wallets set balance = balance - item.price_coins, updated_at = now() where user_id = p_user and balance >= item.price_coins;
 if not found then raise exception 'INSUFFICIENT_BALANCE'; end if;
 insert into public.purchases(user_id,item_id,price_paid,idempotency_key,expires_at)
 values(p_user,p_item,item.price_coins,p_key,case when item.duration_seconds is not null then now()+item.duration_seconds * interval '1 second' end) returning * into result;
 insert into public.wallet_ledger(user_id,delta,reason,reference_id,idempotency_key)
 values(p_user,-item.price_coins,'purchase',result.id,'purchase:' || result.id);
 return result;
end $$;
revoke all on function public.purchase_item(uuid,text,text) from public, anon, authenticated;
grant execute on function public.purchase_item(uuid,text,text) to service_role;

-- Future webhook handler must verify signature, provider, amount, currency and order reference
-- before calling this RPC. No HTTP route exposes it in this release.
create function public.settle_payment(p_order uuid, p_provider text, p_reference text, p_amount bigint) returns void
language plpgsql security invoker set search_path = '' as $$
declare ord public.payment_orders;
begin
 select * into ord from public.payment_orders where id = p_order for update;
 if not found then raise exception 'ORDER_MISSING'; end if;
 if ord.provider <> p_provider or ord.amount_vnd <> p_amount or p_reference is null or char_length(p_reference) = 0 then raise exception 'PAYMENT_MISMATCH'; end if;
 if ord.status = 'paid' then
  if ord.provider_reference is distinct from p_reference then raise exception 'PAYMENT_MISMATCH'; end if;
  return;
 end if;
 if ord.status <> 'pending' then raise exception 'ORDER_NOT_PENDING'; end if;
 if not exists(select 1 from auth.users where id = ord.user_id and is_anonymous is false) then raise exception 'LINKED_ACCOUNT_REQUIRED'; end if;
 update public.wallets set balance = balance + ord.coin_amount, updated_at = now() where user_id = ord.user_id;
 insert into public.wallet_ledger(user_id,delta,reason,reference_id,idempotency_key)
 values(ord.user_id,ord.coin_amount,'payment',ord.id,'payment:' || ord.id);
 update public.payment_orders set status = 'paid', paid_at = now(), provider_reference = p_reference where id = ord.id;
end $$;
revoke all on function public.settle_payment(uuid,text,text,bigint) from public, anon, authenticated;
grant execute on function public.settle_payment(uuid,text,text,bigint) to service_role;
insert into public.shop_items(id,name,price_coins,effect_type) values
 ('tomato','Ném cà chua',20,'tomato'),('tomato-rain','Mưa cà chua',30,'tomato-rain'),
 ('megaphone','Loa cà khịa',50,'megaphone'),('confetti','Pháo giấy',30,'confetti'),
 ('banner','Banner cà khịa',100,'banner'),('cave-pass','Vé đại náo hang',150,'cave-pass');

grant select(id,is_anonymous,email_confirmed_at,phone_confirmed_at) on auth.users to service_role;
grant select(user_id,provider) on auth.identities to service_role;
-- Runs with caller permissions and RLS, keeps BIGINT exact over JSON.
create function public.read_wallet() returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
  'balance', (select balance::text from public.wallets where user_id = auth.uid()),
  'ledger', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,delta::text,reason,created_at from public.wallet_ledger where user_id = auth.uid() order by created_at desc limit 100) x),'[]'::jsonb),
  'purchases', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,item_id,status,expires_at from public.purchases where user_id = auth.uid() order by created_at desc limit 100) x),'[]'::jsonb),
  'items', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,name,price_coins::text from public.shop_items where is_active order by price_coins) x),'[]'::jsonb)
 );
$$;
revoke all on function public.read_wallet() from public, anon;
grant execute on function public.read_wallet() to authenticated;
