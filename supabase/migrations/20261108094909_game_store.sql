-- Store commands run only through the authenticated game server. The wallet row
-- serializes balance, inventory, loadout and receipt changes for each account.
alter table public.wallets add column diamonds bigint not null default 0 check (diamonds >= 0);
alter table public.wallet_ledger add column currency text not null default 'xu'
  check (currency in ('xu', 'kc'));

create table public.game_store_state (
  user_id uuid primary key references public.wallets(user_id) on delete cascade,
  inventory jsonb not null default '{}',
  equipped jsonb not null default '{}',
  quick jsonb not null default '{}',
  furniture jsonb not null default '{}',
  preferences jsonb not null default '{"pranks":true,"effects":true}',
  reward_day date,
  revision bigint not null default 0
);
create table public.game_store_receipts (
  user_id uuid not null references public.game_store_state(user_id) on delete cascade,
  request_id uuid not null,
  id uuid not null default gen_random_uuid() unique,
  command text not null,
  payload jsonb not null,
  recipient uuid references public.game_store_state(user_id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
create index game_store_recipient_idx on public.game_store_receipts(recipient)
  where recipient is not null;

alter table public.game_store_state enable row level security;
alter table public.game_store_receipts enable row level security;
revoke all on public.game_store_state, public.game_store_receipts from public, anon, authenticated;
grant select, insert, update on public.game_store_state to service_role;
grant select, insert on public.game_store_receipts to service_role;

create function public.game_store_command(
  p_user uuid, p_command text, p_request uuid, p_input jsonb, p_rules jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  s public.game_store_state;
  r public.game_store_state;
  receipt public.game_store_receipts;
  wallet public.wallets;
  target uuid := (p_input->>'recipient')::uuid;
  sku text := p_input->>'sku';
  slot text := p_rules->>'slot';
  quantity int := coalesce((p_input->>'quantity')::int, 1);
  price bigint := (p_rules->>'price')::bigint;
  currency text := p_rules->>'currency';
  today date := (statement_timestamp() at time zone (p_rules->>'timezone'))::date;
  grants jsonb := '{}';
  entry record;
  held int;
  replay boolean := false;
  placement jsonb;
  previous jsonb;
  bootstrap boolean;
begin
  if p_command not in ('load','claim','buy','equip','quick','use','gift','preferences','place','remove')
     or (p_command <> 'load' and p_request is null)
     or (target is not null and (target = p_user or p_command <> 'gift')) then
    raise exception 'INVALID_REQUEST';
  end if;

  perform 1 from public.wallets where user_id in (p_user, target) order by user_id for update;
  select * into strict wallet from public.wallets where user_id = p_user;
  insert into public.game_store_state(user_id, inventory, equipped, quick, reward_day)
    values (p_user, (p_rules->'starter') || (p_rules->'daily'), '{"torso":"F12","legs":"F13","feet":"F14"}',
      '{"1":"F01","2":"F02","3":"F03","4":"F04","5":"F10"}', today)
    on conflict do nothing;
  bootstrap := found;
  select * into strict s from public.game_store_state where user_id = p_user;

  if bootstrap then
    update public.wallets set balance = balance + 500, diamonds = diamonds + 100,
      updated_at = now() where user_id = p_user;
    insert into public.wallet_ledger(user_id,delta,reason,reference_id,idempotency_key,currency)
      values
      (p_user,500,'store_welcome',p_user,'store-welcome-xu:' || p_user,'xu'),
      (p_user,100,'store_welcome',p_user,'store-welcome-kc:' || p_user,'kc');
  end if;

  if p_request is not null then
    select * into receipt from public.game_store_receipts where user_id = p_user and request_id = p_request;
    if found then
      if receipt.command <> p_command or receipt.payload <> p_input then
        raise exception 'REQUEST_CONFLICT';
      end if;
      replay := true;
    end if;
  end if;

  if not replay then
    if p_command = 'claim' and (s.reward_day is null or s.reward_day < today) then
      grants := p_rules->'daily';
      s.reward_day := today;
    elsif p_command = 'claim' and not bootstrap then
      raise exception 'ALREADY_CLAIMED';
    end if;

    held := coalesce((s.inventory->>sku)::int, 0);
    case p_command
      when 'buy' then
        if not exists (
          select 1 from auth.users u where u.id = p_user and u.is_anonymous is false
            and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null
              or exists (select 1 from auth.identities i where i.user_id = u.id and i.provider in ('google','facebook')))
        ) then raise exception 'LINK_REQUIRED'; end if;
        if price is null or price <= 0 or currency not in ('xu','kc')
          or quantity not between 1 and (p_rules->>'maxOrder')::int then
          raise exception 'INVALID_REQUEST';
        end if;
        update public.wallets set
          balance = balance - case when currency = 'xu' then price * quantity else 0 end,
          diamonds = diamonds - case when currency = 'kc' then price * quantity else 0 end,
          updated_at = now()
          where user_id = p_user
            and (case when currency = 'xu' then balance else diamonds end) >= price * quantity;
        if not found then raise exception 'INSUFFICIENT_BALANCE'; end if;
        grants := coalesce(p_rules->'contents', jsonb_build_object(sku,1));
      when 'equip' then
        if slot is null then raise exception 'INVALID_SLOT'; end if;
        if p_input->>'unequip' = 'true' then
          if s.equipped->>slot = sku then s.equipped := s.equipped - slot; end if;
        else
          if held < 1 then raise exception 'NOT_OWNED'; end if;
          s.equipped := jsonb_set(s.equipped, array[slot], to_jsonb(sku));
        end if;
      when 'quick' then
        if coalesce(p_input->>'index','') !~ '^[1-5]$' then raise exception 'INVALID_SLOT'; end if;
        if sku is null then s.quick := s.quick - (p_input->>'index');
        else
          if held < 1 then raise exception 'NOT_OWNED'; end if;
          s.quick := jsonb_set(s.quick, array[p_input->>'index'], to_jsonb(sku));
        end if;
      when 'use', 'gift' then
        if held < 1 then raise exception 'NOT_OWNED'; end if;
        if p_rules->>'action' = 'throw' and p_command = 'use' and s.equipped->>'hand' is distinct from sku then
          raise exception 'NOT_EQUIPPED';
        end if;
        if p_command = 'gift' or p_rules->>'consumable' = 'true' then
          if s.furniture ? sku then raise exception 'ITEM_PLACED'; end if;
          if held = 1 then
            s.inventory := s.inventory - sku;
            if s.equipped->>slot = sku then s.equipped := s.equipped - slot; end if;
          else
            s.inventory := jsonb_set(s.inventory, array[sku], to_jsonb(held - 1));
          end if;
        end if;
        if p_command = 'gift' then
          select * into r from public.game_store_state where user_id = target;
          if not found then raise exception 'RECIPIENT_UNAVAILABLE'; end if;
          if p_rules->>'prank' = 'true' and r.preferences->>'pranks' <> 'true' then
            raise exception 'GIFT_DECLINED';
          end if;
          held := coalesce((r.inventory->>sku)::int, 0);
          if held >= 999 or (held > 0 and p_rules->>'stackable' <> 'true') then
            raise exception 'RECIPIENT_LIMIT';
          end if;
          update public.game_store_state set inventory = jsonb_set(r.inventory, array[sku], to_jsonb(held + 1)),
            revision = revision + 1 where user_id = target;
        end if;
      when 'preferences' then
        s.preferences := s.preferences || p_input;
      when 'place' then
        if held < 1 then raise exception 'NOT_OWNED'; end if;
        placement := p_input->'placement';
        if not s.furniture ? sku and (select count(*) from jsonb_each(s.furniture)) >= 12 then
          raise exception 'ROOM_FULL';
        end if;
        for entry in select * from jsonb_each(s.furniture - sku) loop
          previous := entry.value;
          if sqrt(power((placement->>'x')::float - (previous->>'x')::float, 2)
                + power((placement->>'z')::float - (previous->>'z')::float, 2))
                < (placement->>'radius')::float + (previous->>'radius')::float then
            raise exception 'PLACEMENT_BLOCKED';
          end if;
        end loop;
        s.furniture := jsonb_set(s.furniture, array[sku], placement);
      when 'remove' then s.furniture := s.furniture - sku;
      else null;
    end case;

    for entry in select * from jsonb_each_text(grants) loop
      held := coalesce((s.inventory->>entry.key)::int, 0);
      if p_command = 'buy' and held + entry.value::int * quantity > 1
        and not (p_rules->'stackableGrants' ? entry.key) then
        raise exception 'ALREADY_OWNED';
      end if;
      if p_command = 'buy' and held + entry.value::int * quantity > 999 then
        raise exception 'INVENTORY_LIMIT';
      end if;
      s.inventory := jsonb_set(s.inventory, array[entry.key], to_jsonb(least(999, held + entry.value::int * quantity)));
    end loop;

    if p_command <> 'load' or bootstrap then
      update public.game_store_state set
        inventory = s.inventory, equipped = s.equipped, quick = s.quick,
        furniture = s.furniture, preferences = s.preferences, reward_day = s.reward_day,
        revision = revision + 1 where user_id = p_user returning * into s;
    end if;
    if p_request is not null then
      insert into public.game_store_receipts(user_id,request_id,command,payload,recipient)
        values (p_user,p_request,p_command,p_input,target) returning * into receipt;
    end if;
    if p_command = 'claim' and not bootstrap then
      update public.wallets set balance = balance + 100, diamonds = diamonds + 10,
        updated_at = now() where user_id = p_user;
      insert into public.wallet_ledger(user_id,delta,reason,reference_id,idempotency_key,currency)
        values
        (p_user,100,'store_daily',receipt.id,'store-daily-xu:' || receipt.id,'xu'),
        (p_user,10,'store_daily',receipt.id,'store-daily-kc:' || receipt.id,'kc');
    end if;
    if p_command = 'buy' then
      insert into public.wallet_ledger(user_id,delta,reason,reference_id,idempotency_key,currency)
        values (p_user,-price * quantity,'store_purchase',receipt.id,'store-buy:' || receipt.id,currency);
    end if;
  end if;

  select * into strict wallet from public.wallets where user_id = p_user;
  return jsonb_build_object(
    'wallet', jsonb_build_object('xu',wallet.balance::text,'kc',wallet.diamonds::text),
    'inventory',s.inventory,'equipped',s.equipped,'quick',s.quick,'furniture',s.furniture,
    'preferences',s.preferences,'canClaim',s.reward_day is null or s.reward_day < today,
    'revision',s.revision,'transactionId',receipt.id,'replay',replay,
    'giftAnimate', coalesce(r.preferences->>'effects' = 'true' and s.preferences->>'effects' = 'true', false),
    'history', coalesce((select jsonb_agg(to_jsonb(h)) from (
      select id, delta::text, ledger.currency, reason, reference_id as "transactionId", created_at as "at"
      from public.wallet_ledger as ledger where user_id = p_user order by created_at desc limit 25
    ) h),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.game_store_command(uuid,text,uuid,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.game_store_command(uuid,text,uuid,jsonb,jsonb) to service_role;

create or replace function public.read_wallet() returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
  'balance', (select balance::text from public.wallets where user_id = auth.uid()),
  'diamonds', (select diamonds::text from public.wallets where user_id = auth.uid()),
  'ledger', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,delta::text,currency,reason,created_at from public.wallet_ledger where user_id = auth.uid() order by created_at desc limit 100) x),'[]'::jsonb),
  'purchases', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,item_id,status,expires_at from public.purchases where user_id = auth.uid() order by created_at desc limit 100) x),'[]'::jsonb),
  'items', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,name,price_coins::text from public.shop_items where is_active order by price_coins) x),'[]'::jsonb)
 );
$$;
