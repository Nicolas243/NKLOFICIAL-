-- 0050_performance_fk_indexes_and_rls_policies.sql
-- Covers all 24 unindexed foreign keys flagged by Supabase Performance Advisor
-- and defines explicit deny-all RLS policies for server-only Drizzle tables
-- flagged by Security Advisor lint 0008_rls_enabled_no_policy.

CREATE INDEX IF NOT EXISTS idx_ad_inventory_slots_campaign_id
  ON public.ad_inventory_slots (campaign_id);

CREATE INDEX IF NOT EXISTS idx_business_directory_user_id
  ON public.business_directory (user_id);

CREATE INDEX IF NOT EXISTS idx_favorite_businesses_business_id
  ON public.favorite_businesses (business_id);

CREATE INDEX IF NOT EXISTS idx_favorite_luthiers_luthier_id
  ON public.favorite_luthiers (luthier_id);

CREATE INDEX IF NOT EXISTS idx_favorite_professors_professor_id
  ON public.favorite_professors (professor_id);

CREATE INDEX IF NOT EXISTS idx_favorite_strings_string_id
  ON public.favorite_strings (string_id);

CREATE INDEX IF NOT EXISTS idx_guide_offer_events_purchase_id
  ON public.guide_offer_events (purchase_id);

CREATE INDEX IF NOT EXISTS idx_guide_offer_events_subscription_id
  ON public.guide_offer_events (subscription_id);

CREATE INDEX IF NOT EXISTS idx_guide_purchases_user_id
  ON public.guide_purchases (user_id);

CREATE INDEX IF NOT EXISTS idx_guide_subscriptions_user_id
  ON public.guide_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_luthier_leads_luthier_id
  ON public.luthier_leads (luthier_id);

CREATE INDEX IF NOT EXISTS idx_luthier_leads_user_id
  ON public.luthier_leads (user_id);

CREATE INDEX IF NOT EXISTS idx_luthier_portfolio_luthier_id
  ON public.luthier_portfolio (luthier_id);

CREATE INDEX IF NOT EXISTS idx_luthier_reviews_user_id
  ON public.luthier_reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_news_comments_news_id
  ON public.news_comments (news_id);

CREATE INDEX IF NOT EXISTS idx_news_comments_user_id
  ON public.news_comments (user_id);

CREATE INDEX IF NOT EXISTS idx_news_events_user_id
  ON public.news_events (user_id);

CREATE INDEX IF NOT EXISTS idx_news_likes_user_id
  ON public.news_likes (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_partner_referral_leads_program_id
  ON public.partner_referral_leads (program_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_saved_partner_programs_program_id
  ON public.saved_partner_programs (program_id);

CREATE INDEX IF NOT EXISTS idx_string_reviews_user_id
  ON public.string_reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions (user_id);

DO $$
DECLARE
  tbl TEXT;
  target_tables TEXT[] := ARRAY[
    'ad_campaigns',
    'ad_inventory_slots',
    'ai_access_grants',
    'ai_course_lessons',
    'ai_learning_progress',
    'business_directory',
    'business_profiles',
    'favorite_businesses',
    'favorite_luthiers',
    'favorite_professors',
    'favorite_strings',
    'guide_download_attempts',
    'guide_offer_events',
    'guide_purchases',
    'guide_subscriptions',
    'luthier_leads',
    'luthier_portfolio',
    'luthier_reviews',
    'news_comments',
    'news_events',
    'news_feed',
    'news_likes',
    'news_suggestions',
    'notifications',
    'partner_program_reviews',
    'partner_programs',
    'partner_referral_leads',
    'partner_suggestions',
    'password_change_attempts',
    'push_subscriptions',
    'quiz_leads',
    'saved_partner_programs',
    'string_reviews',
    'strings_catalog',
    'subscriptions',
    'user_profiles',
    'users'
  ];
BEGIN
  FOREACH tbl IN ARRAY target_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl
        AND policyname = 'deny_direct_client_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY deny_direct_client_access ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
        tbl
      );
    END IF;
  END LOOP;
END $$;
