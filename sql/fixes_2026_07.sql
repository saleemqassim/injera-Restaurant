-- ═══════════════════════════════════════════════════════════════════
--  BLACK LION — Bug-Fixes (Tischreservierung)
--  Gefunden: 2026-07-16
--  In Supabase SQL-Editor ausführen: supabase.com → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── FIX 1: insert_reservation_safe ──────────────────────────────
--  Fügt Backend-Validierung hinzu:
--  • Vergangene Daten abweisen (bisher nur Frontend-Schutz)
--  • Geschlossene Tage (aus settings.config.schedule) prüfen
-- ────────────────────────────────────────────────────────────────
create or replace function insert_reservation_safe(
  p_name text, p_phone text, p_email text, p_guests int,
  p_date date, p_time text, p_note text, p_max_guests int
) returns bigint language plpgsql security definer as $$
declare
  booked   int;
  new_id   bigint;
  cfg      jsonb;
  schedule jsonb;
  dow      int;
  day_cfg  jsonb;
begin
  -- Vergangenes Datum ablehnen
  if p_date < current_date then
    raise exception 'Datum liegt in der Vergangenheit';
  end if;

  -- Geschlossenen Wochentag prüfen (aus settings Tabelle)
  select value into cfg from settings where key = 'config';
  if cfg is not null then
    schedule := cfg->'schedule';
    dow := extract(dow from p_date)::int;  -- 0=Sonntag … 6=Samstag
    if schedule is not null then
      day_cfg := schedule->dow;
      if day_cfg is not null and (day_cfg->>'open')::boolean = false then
        raise exception 'Restaurant an diesem Tag geschlossen';
      end if;
    else
      -- Fallback: closedDays Array prüfen
      if cfg->'closedDays' @> to_jsonb(dow) then
        raise exception 'Restaurant an diesem Tag geschlossen';
      end if;
    end if;
  end if;

  -- Advisory Lock: serialisiert gleichzeitige Buchungen für denselben Slot
  perform pg_advisory_xact_lock(hashtext(p_date::text || '|' || p_time));

  select coalesce(sum(guests),0) into booked
    from reservations
    where date=p_date and time=p_time and status<>'cancelled';

  if booked + p_guests > p_max_guests then
    raise exception 'Slot ausgebucht: noch % Plätze frei', greatest(0, p_max_guests - booked);
  end if;

  insert into reservations(name,phone,email,guests,date,time,note,status)
    values(p_name,p_phone,p_email,p_guests,p_date,p_time,p_note,'confirmed')
    returning id into new_id;

  return new_id;
end;
$$;

grant execute on function insert_reservation_safe to anon;


-- ── FIX 2: cancel_reservation_by_id ─────────────────────────────
--  Neue RPC-Funktion: Erlaubt anonymen Gästen, eine Reservierung
--  per ID zu stornieren (für den Stornierungslink in der E-Mail).
--  Prüft: nicht in der Vergangenheit, nicht bereits storniert.
-- ────────────────────────────────────────────────────────────────
create or replace function cancel_reservation_by_id(p_id bigint)
returns jsonb language plpgsql security definer as $$
declare
  res reservations%rowtype;
begin
  select * into res from reservations where id = p_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Reservierung nicht gefunden');
  end if;

  if res.status = 'cancelled' then
    return jsonb_build_object('ok', false, 'error', 'Bereits storniert');
  end if;

  if res.date < current_date then
    return jsonb_build_object('ok', false, 'error', 'Liegt in der Vergangenheit');
  end if;

  update reservations set status = 'cancelled' where id = p_id;

  return jsonb_build_object(
    'ok', true,
    'name', res.name,
    'date', res.date::text,
    'time', res.time,
    'guests', res.guests
  );
end;
$$;

grant execute on function cancel_reservation_by_id to anon;


-- ── CLEANUP: Test-Reservierungen löschen ────────────────────────
--  Testbuchungen vom 2026-07-16 entfernen
-- ────────────────────────────────────────────────────────────────
delete from reservations where id in (257, 258, 259, 260);
