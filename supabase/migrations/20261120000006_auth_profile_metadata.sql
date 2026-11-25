CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users(id, full_name, email, institution, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    NULLIF(new.raw_user_meta_data->>'institution', ''),
    NULLIF(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      institution = COALESCE(EXCLUDED.institution, public.users.institution),
      phone = COALESCE(EXCLUDED.phone, public.users.phone);

  INSERT INTO public.user_roles(user_id, role_id)
  SELECT new.id, r.id
  FROM public.roles r
  WHERE r.key = 'peserta'
  ON CONFLICT (user_id, role_id, competition_id) DO NOTHING;

  RETURN new;
END;
$$;
