-- Mask (FakeTLS SNI) domains: a pool on one telemt node. Each subscription is
-- pinned to one domain at issuance; failing domains are disabled and their
-- users get a reissued link with another domain (same key).

CREATE TABLE IF NOT EXISTS public.mask_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  last_check_at timestamptz,
  last_ok boolean,
  last_error text,
  fail_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS sni_domain text;

CREATE INDEX IF NOT EXISTS subscriptions_sni_domain_idx ON public.subscriptions (sni_domain);
