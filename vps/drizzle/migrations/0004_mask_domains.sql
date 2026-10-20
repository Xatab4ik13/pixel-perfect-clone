-- Mask (FakeTLS SNI) domains on one telemt node. Everyone gets the primary
-- domain; the rest are checked reserves. Switching primary reissues links
-- (same key, new domain).

CREATE TABLE IF NOT EXISTS public.mask_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  last_check_at timestamptz,
  last_ok boolean,
  last_error text,
  fail_count integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS sni_domain text;

CREATE INDEX IF NOT EXISTS subscriptions_sni_domain_idx ON public.subscriptions (sni_domain);

CREATE UNIQUE INDEX IF NOT EXISTS mask_domains_one_primary ON public.mask_domains (is_primary) WHERE is_primary;
