CREATE UNIQUE INDEX identity_verifications_one_ktm_per_user
  ON public.identity_verifications (user_id)
  WHERE document_type = 'ktm';

DROP POLICY IF EXISTS "identity_insert_own" ON public.identity_verifications;
DROP POLICY IF EXISTS "identity_panitia_read" ON public.identity_verifications;
DROP POLICY IF EXISTS "identity_panitia_update" ON public.identity_verifications;

CREATE POLICY "identity_panitia_read_scoped" ON public.identity_verifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.registrations r
      WHERE r.user_id = identity_verifications.user_id
        AND public.has_role('panitia', r.competition_id)
    )
  );

DROP POLICY IF EXISTS "identity_docs_read" ON storage.objects;
CREATE POLICY "identity_docs_read_scoped" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'identity-docs' AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text OR
      public.has_role('super_admin') OR
      EXISTS (
        SELECT 1
        FROM public.registrations r
        WHERE r.user_id::text = (storage.foldername(name))[1]
          AND public.has_role('panitia', r.competition_id)
      )
    )
  );

DROP POLICY IF EXISTS "identity_docs_insert" ON storage.objects;
CREATE POLICY "identity_docs_insert_student" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'identity-docs' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text AND
    public.has_role('peserta') AND
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = (SELECT auth.uid())
        AND u.education_level = 'mahasiswa'
    )
  );
