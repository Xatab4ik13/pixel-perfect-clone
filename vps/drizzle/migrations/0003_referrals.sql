-- Referral program: each user has a shareable code; invited friends are tracked,
-- and the referrer is rewarded with free days when the friend first pays.

-- 1) Per-user referral code (8 hex chars). Backfill existing rows, then enforce.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code text;

UPDATE public.users
  SET referral_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  WHERE referral_code IS NULL;

ALTER TABLE public.users
  ALTER COLUMN referral_code SET DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

ALTER TABLE public.users
  ALTER COLUMN referral_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_idx ON public.users (referral_code);

-- 2) Referral records. One per invited user (referred_user_id is unique), so a
--    friend can only ever be attributed to a single referrer.
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rewarded')),
  reward_days integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  rewarded_at timestamptz,
  CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_user_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON public.referrals (status);
