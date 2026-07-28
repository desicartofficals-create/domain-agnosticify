
-- 1. Drop the old auto-admin function (no longer needed)
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;

-- 2. Create the admin user directly in auth.users
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  hashed_pw text;
BEGIN
  -- Skip if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@desicart.xyz') THEN
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@desicart.xyz';
  ELSE
    hashed_pw := crypt('Huzaifa4028@', gen_salt('bf'));

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'admin@desicart.xyz',
      hashed_pw,
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', 'admin@desicart.xyz', 'email_verified', true),
      'email',
      'admin@desicart.xyz',
      now(), now(), now()
    );
  END IF;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
