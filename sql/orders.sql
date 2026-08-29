-- ═══════════════════════════════════════════════════════════════
--  INJERA — Online-Bestellung / Abholung — Schema
--  Im Supabase SQL-Editor ausführen.
-- ═══════════════════════════════════════════════════════════════

-- ── Bestellungen ────────────────────────────────────────────────
create table if not exists orders (
  id            bigserial    primary key,
  created_at    timestamptz  default now(),
  name          text         not null,
  phone         text         not null,
  email         text,
  note          text,
  pickup_date   date         not null,
  pickup_time   text         not null,
  total         numeric(10,2) not null default 0,
  status        text         default 'pending'   -- pending | confirmed | ready | done | cancelled
);

-- ── Bestellpositionen ───────────────────────────────────────────
create table if not exists order_items (
  id          bigserial    primary key,
  order_id    bigint       not null references orders(id) on delete cascade,
  item_key    text,
  name        text         not null,
  option      text,
  qty         int          not null default 1,
  unit_price  numeric(10,2) not null default 0,
  line_total  numeric(10,2) not null default 0
);

create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_orders_created on orders(created_at desc);

-- ── Row Level Security ──────────────────────────────────────────
alter table orders      enable row level security;
alter table order_items enable row level security;

-- Gäste dürfen Bestellungen anlegen (nur als pending)
create policy "anon_insert_orders"
  on orders for insert to anon with check (status = 'pending');

create policy "anon_insert_order_items"
  on order_items for insert to anon with check (true);

-- Restaurant (eingeloggt) darf alles
create policy "auth_all_orders"
  on orders for all to authenticated using (true);

create policy "auth_all_order_items"
  on order_items for all to authenticated using (true);

-- ── Realtime aktivieren ─────────────────────────────────────────
-- Im Supabase Dashboard: Database → Replication → orders + order_items aktivieren
-- oder:
-- alter publication supabase_realtime add table orders;
-- alter publication supabase_realtime add table order_items;
