CREATE TABLE public.referral_accounts (user_id uuid PRIMARY KEY, code uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.referral_accounts TO authenticated;
GRANT ALL ON public.referral_accounts TO service_role;
ALTER TABLE public.referral_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_account ON public.referral_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.referral_rewards (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inviter_id uuid NOT NULL REFERENCES public.referral_accounts(user_id), friend_id uuid NOT NULL UNIQUE REFERENCES public.referral_accounts(user_id), days integer NOT NULL DEFAULT 30 CHECK (days = 30), available_from date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), CHECK (inviter_id <> friend_id));
GRANT SELECT ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_rewards ON public.referral_rewards FOR SELECT TO authenticated USING (inviter_id = auth.uid());
CREATE FUNCTION public.ensure_referral_account() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 INSERT INTO public.referral_accounts(user_id) VALUES(auth.uid()) ON CONFLICT(user_id) DO NOTHING;
 SELECT code INTO result FROM public.referral_accounts WHERE user_id=auth.uid();
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.ensure_referral_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_referral_account() TO authenticated;
CREATE FUNCTION public.accept_referral(invite_code uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inviter uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT user_id INTO inviter FROM public.referral_accounts WHERE code=invite_code;
 IF inviter IS NULL THEN RAISE EXCEPTION 'Invalid invitation'; END IF;
 IF inviter=auth.uid() THEN RAISE EXCEPTION 'Cannot invite yourself'; END IF;
 INSERT INTO public.referral_accounts(user_id) VALUES(auth.uid()) ON CONFLICT(user_id) DO NOTHING;
 INSERT INTO public.referral_rewards(inviter_id, friend_id, days, available_from) VALUES(inviter, auth.uid(), 30, (date_trunc('month',now() AT TIME ZONE 'UTC') + interval '1 month')::date) ON CONFLICT(friend_id) DO NOTHING;
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.accept_referral(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_referral(uuid) TO authenticated;