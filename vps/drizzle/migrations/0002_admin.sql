-- Admin/staff accounts for the admin panel (email + password login).
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('viewer','operator','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
