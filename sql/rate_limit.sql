-- Serverseitiges Rate-Limit: max 3 Buchungen pro Telefonnummer in 24 Stunden
-- In Supabase SQL Editor ausführen

CREATE OR REPLACE FUNCTION insert_reservation_safe(
  p_name text, p_phone text, p_email text, p_guests int,
  p_date date, p_time text, p_note text, p_max_guests int
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $func$
DECLARE
  booked int;
  phone_count int;
BEGIN
  -- Rate-Limit: max 3 Buchungen pro Telefonnummer in 24h
  SELECT COUNT(*) INTO phone_count
    FROM reservations
    WHERE phone = p_phone
      AND created_at > NOW() - INTERVAL '24 hours';
  IF phone_count >= 3 THEN
    RAISE EXCEPTION 'Zu viele Buchungen mit dieser Nummer. Bitte rufen Sie uns an.';
  END IF;

  -- Kapazitätsprüfung
  SELECT COALESCE(SUM(guests), 0) INTO booked
    FROM reservations
    WHERE date = p_date AND time = p_time AND status <> 'cancelled';
  IF booked + p_guests > p_max_guests THEN
    RAISE EXCEPTION 'Slot ausgebucht: noch % Plaetze frei', p_max_guests - booked;
  END IF;

  INSERT INTO reservations(name, phone, email, guests, date, time, note, status)
    VALUES (p_name, p_phone, p_email, p_guests, p_date, p_time, p_note, 'pending');
END;
$func$;

GRANT EXECUTE ON FUNCTION insert_reservation_safe TO anon;
