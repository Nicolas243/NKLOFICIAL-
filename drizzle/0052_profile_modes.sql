ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS music_profile_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS income_profile_enabled boolean NOT NULL DEFAULT true;

UPDATE public.user_profiles up
SET music_profile_enabled = true
WHERE up.music_profile_enabled = false
  AND (
    up.role IN ('luthier', 'professor')
    OR up.papel IN ('Músico', 'Musico', 'Luthier', 'Professor', 'Lojista', 'Aluno')
    OR up.papel ~* '(m[uú]sico|luthier|professor|lojista|aluno)'
    OR (up.instrumento IS NOT NULL AND btrim(up.instrumento) <> '')
    OR EXISTS (SELECT 1 FROM public.favorite_strings fs WHERE fs.user_id = up.id)
    OR EXISTS (SELECT 1 FROM public.favorite_luthiers fl WHERE fl.user_id = up.id)
    OR EXISTS (SELECT 1 FROM public.favorite_businesses fb WHERE fb.user_id = up.id)
    OR EXISTS (SELECT 1 FROM public.favorite_professors fp WHERE fp.user_id = up.id)
    OR EXISTS (SELECT 1 FROM public.string_reviews sr WHERE sr.user_id = up.id)
    OR EXISTS (SELECT 1 FROM public.luthier_reviews lr WHERE lr.user_id = up.id)
    OR EXISTS (SELECT 1 FROM public.business_directory bd WHERE bd.user_id = up.id)
    OR EXISTS (SELECT 1 FROM public.class_bookings cb WHERE cb.student_id = up.id OR cb.teacher_id = up.id)
  );
