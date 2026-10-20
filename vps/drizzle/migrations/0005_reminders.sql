-- Expiry reminders: remember for which period end each reminder was sent,
-- so a renewal (new period end) re-arms them and nothing is sent twice.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS reminded_3d_for timestamptz,
  ADD COLUMN IF NOT EXISTS reminded_0d_for timestamptz;
