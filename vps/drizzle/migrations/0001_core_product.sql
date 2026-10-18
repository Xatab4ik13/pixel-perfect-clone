-- Core product schema for the Лазейка Telegram Mini App backend.
-- Runs on our OWN Postgres (not Supabase). Access control is enforced in the
-- server routes (Telegram initData auth + role checks), so there is no RLS here.
-- Secrets (ee-links) live only in subscriptions.link and must never be logged.

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint NOT NULL UNIQUE,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  language_code text,
  is_premium boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','viewer','operator','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','canceled')),
  plan_id text,
  current_period_end timestamptz,
  telemt_username text UNIQUE,
  max_unique_ips integer,
  link text,
  secret_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_period_end_idx ON public.subscriptions(current_period_end);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  amount_kopecks integer NOT NULL,
  currency text NOT NULL DEFAULT 'RUB',
  provider text NOT NULL DEFAULT 'sbp',
  provider_payment_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded','canceled')),
  days_granted integer NOT NULL,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON public.audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS audit_events_created_idx ON public.audit_events(created_at);
