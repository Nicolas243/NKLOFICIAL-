import { pgEnum, pgTable, text, timestamp, numeric, integer, uuid, varchar, unique, primaryKey, boolean, jsonb, time, check } from 'drizzle-orm/pg-core';
import { relations, sql, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stringsCatalog = pgTable('strings_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  projection: text('projection').notNull(),
  soundColor: text('sound_color').notNull(),
  coreMaterial: text('core_material').notNull(),
  priceMin: numeric('price_min'),
  priceMax: numeric('price_max'),
  realPrice: numeric('real_price'),
  responseSpeed: text('response_speed'),
  environment: text('environment'),
  qualityLevel: text('quality_level').notNull(),
  communityScore: numeric('community_score').default('0.0'),
  durability: text('durability'),
  climateSensitivity: text('climate_sensitivity'),
  coating: text('coating'),
  fixation: text('fixation'),
  arcTolerance: text('arc_tolerance'),
  affiliateLinks: jsonb('affiliate_links').$type<Record<string, string>>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const newsEvents = pgTable('news_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  location: text('location'),
  imageUrl: text('image_url'),
  status: text('status').notNull().default('pending'),
  helpfulCount: integer('helpful_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const businessDirectory = pgTable('business_directory', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => userProfiles.id).notNull(),
  businessName: text('business_name').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  planType: text('plan_type').notNull().default('free'),
  whatsapp: text('whatsapp'),
  // Tarefa 12 — cartões enriquecidos do diretório (lojas/luthiers).
  imageUrl: text('image_url'),
  instrumentTypes: text('instrument_types'),
  repairTypes: text('repair_types'),
  isSuspended: boolean('is_suspended').notNull().default(false),
  suspendedAt: timestamp('suspended_at'),
  suspensionReason: text('suspension_reason'),
  resolvedReportsCount: integer('resolved_reports_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const newsFeed = pgTable('news_feed', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  tags: varchar('tags', { length: 255 }), 
  imageUrl: text('image_url').notNull(),
  // Tarefa 9 — autoria editorial (seed inicial: Admin-flame)
  author: varchar('author', { length: 255 }).default('Admin-flame'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tarefa 9 — engajamento: comentários e likes em notícias.
export const newsComments = pgTable('news_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  newsId: uuid('news_id')
    .references(() => newsFeed.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => userProfiles.id)
    .notNull(),
  authorName: varchar('author_name', { length: 255 }).notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const newsLikes = pgTable(
  'news_likes',
  {
    newsId: uuid('news_id')
      .references(() => newsFeed.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => userProfiles.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      name: 'news_likes_news_id_user_id_pk',
      columns: [table.newsId, table.userId],
    }),
  ]
);

export const newsCommentsRelations = relations(newsComments, ({ one }) => ({
  news: one(newsFeed, {
    fields: [newsComments.newsId],
    references: [newsFeed.id],
  }),
  user: one(userProfiles, {
    fields: [newsComments.userId],
    references: [userProfiles.id],
  }),
}));

export const newsLikesRelations = relations(newsLikes, ({ one }) => ({
  news: one(newsFeed, {
    fields: [newsLikes.newsId],
    references: [newsFeed.id],
  }),
  user: one(userProfiles, {
    fields: [newsLikes.userId],
    references: [userProfiles.id],
  }),
}));

export const newsSuggestions = pgTable('news_suggestions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  contentOrLink: text('content_or_link').notNull(),
  suggestedBy: varchar('suggested_by', { length: 255 }),
  imageUrl: text('image_url'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const partnerPrograms = pgTable('partner_programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  name: varchar('name', { length: 180 }).notNull(),
  shortDescription: text('short_description').notNull(),
  longDescription: text('long_description').notNull(),
  category: varchar('category', { length: 80 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  websiteUrl: text('website_url').notNull(),
  affiliateUrl: text('affiliate_url'),
  editorialRating: integer('editorial_rating').notNull(),
  editorialSource: text('editorial_source').notNull(),
  pros: jsonb('pros').$type<string[]>().notNull().default([]),
  cons: jsonb('cons').$type<string[]>().notNull().default([]),
  requirements: jsonb('requirements').$type<string[]>().notNull().default([]),
  paymentMethods: jsonb('payment_methods').$type<string[]>().notNull().default([]),
  earningPotential: text('earning_potential'),
  lastVerifiedAt: timestamp('last_verified_at'),
  youtubeVideoId: text('youtube_video_id'),
  tiktokVideoId: text('tiktok_video_id'),
  zeroInvestmentRequired: boolean('zero_investment_required').notNull().default(true),
  status: varchar('status', { length: 20 }).notNull().default('published'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const partnerProgramReviews = pgTable(
  'partner_program_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id')
      .references(() => partnerPrograms.id, { onDelete: 'cascade' })
      .notNull(),
    reviewerKeyHash: varchar('reviewer_key_hash', { length: 64 }).notNull(),
    rating: integer('rating').notNull(),
    payAmount: numeric('pay_amount', { precision: 10, scale: 2 }),
    payCurrency: varchar('pay_currency', { length: 3 }),
    payPeriod: varchar('pay_period', { length: 20 }),
    reason: text('reason').notNull(),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    status: varchar('status', { length: 20 }).notNull().default('published'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('partner_program_reviews_program_reviewer_unique').on(
      table.programId,
      table.reviewerKeyHash
    ),
  ]
);

export const partnerSuggestions = pgTable('partner_suggestions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 180 }).notNull(),
  websiteUrl: text('website_url'),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const partnerReferralLeads = pgTable('partner_referral_leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id')
    .references(() => partnerPrograms.id, { onDelete: 'cascade' })
    .notNull(),
  contactName: varchar('contact_name', { length: 180 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  consentConfirmed: boolean('consent_confirmed').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('new'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  fullName: varchar('full_name', { length: 255 }),
  businessName: varchar('business_name', { length: 255 }),
  city: varchar('city', { length: 150 }),
  state: varchar('state', { length: 2 }),
  bio: text('bio'),
  planType: varchar('plan_type', { length: 20 }).notNull().default('free'),
  // Onboarding metadata (FASE 130)
  papel: varchar('papel', { length: 50 }),          // Músico, Lojista, Luthier, Professor, Aluno
  instrumento: varchar('instrumento', { length: 100 }), // instrumento principal
  anosExperiencia: integer('anos_experiencia'),       // anos de experiência
  newsletterOptIn: boolean('newsletter_opt_in').default(false),
  birthDate: varchar('birth_date', { length: 10 }),
  hourlyRateCents: integer('hourly_rate_cents').notNull().default(15000),
  singleClassPriceCents: integer('single_class_price_cents').notNull().default(15000),
  monthlyPlanPriceCents: integer('monthly_plan_price_cents').notNull().default(54000),
  semiannualPlanPriceCents: integer('semiannual_plan_price_cents').notNull().default(288000),
  annualPlanPriceCents: integer('annual_plan_price_cents').notNull().default(504000),
  mpCollectorId: text('mp_collector_id'),
  mpAccessToken: text('mp_access_token'),
  mpRefreshToken: text('mp_refresh_token'),
  mpTokenExpiresAt: timestamp('mp_token_expires_at'),
  mpConnectedAt: timestamp('mp_connected_at'),
  acceptsNewStudents: boolean('accepts_new_students').notNull().default(true),
  isSuspended: boolean('is_suspended').notNull().default(false),
  suspendedAt: timestamp('suspended_at'),
  suspensionReason: text('suspension_reason'),
  resolvedReportsCount: integer('resolved_reports_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stringReviews = pgTable(
  'string_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stringId: uuid('string_id')
      .references(() => stringsCatalog.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => userProfiles.id)
      .notNull(),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // Impossibilita duplicidade estrutural: um usuário, uma avaliação por corda.
    unique('string_reviews_string_id_user_id_unique').on(table.stringId, table.userId),
  ]
);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => userProfiles.id)
    .notNull(),
  gatewayProvider: varchar('gateway_provider', { length: 30 }).notNull().default('mercadopago'),
  gatewaySubscriptionId: varchar('gateway_subscription_id', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(userProfiles, {
    fields: [subscriptions.userId],
    references: [userProfiles.id],
  }),
}));

export const guidePurchaseStatusEnum = pgEnum('guide_purchase_status', [
  'pending',
  'approved',
  'rejected',
]);

export const guidePurchases = pgTable('guide_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email'),
  status: guidePurchaseStatusEnum('status').notNull().default('pending'),
  paymentId: text('payment_id'),
  amountCents: integer('amount_cents').notNull(),
  offerVariant: varchar('offer_variant', { length: 64 }),
  downloadCount: integer('download_count').notNull().default(0),
  maxDownloads: integer('max_downloads').notNull().default(3),
  lastDownloadedAt: timestamp('last_downloaded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const guideSubscriptions = pgTable('guide_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalReference: varchar('external_reference', { length: 120 }).notNull().unique(),
  gatewaySubscriptionId: varchar('gateway_subscription_id', { length: 120 }).unique(),
  email: text('email'),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  amountCents: integer('amount_cents').notNull(),
  offerVariant: varchar('offer_variant', { length: 64 }),
  downloadCount: integer('download_count').notNull().default(0),
  maxDownloads: integer('max_downloads').notNull().default(3),
  lastDownloadedAt: timestamp('last_downloaded_at'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const guideOfferEvents = pgTable('guide_offer_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  experiment: varchar('experiment', { length: 40 }).notNull(),
  variant: varchar('variant', { length: 64 }).notNull(),
  eventType: varchar('event_type', { length: 20 }).notNull(),
  purchaseId: uuid('purchase_id').references(() => guidePurchases.id, { onDelete: 'set null' }),
  subscriptionId: uuid('subscription_id').references(() => guideSubscriptions.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => userProfiles.id)
    .notNull(),
  type: varchar('type', { length: 30 }).notNull().default('system_alert'),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  relatedId: uuid('related_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(userProfiles, {
    fields: [notifications.userId],
    references: [userProfiles.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  businessDirectory: many(businessDirectory),
  subscriptions: many(subscriptions),
  notifications: many(notifications),
  stringReviews: many(stringReviews),
  favoriteStrings: many(favoriteStrings),
  favoriteLuthiersAsUser: many(favoriteLuthiers, { relationName: 'favoritedByUser' }),
  savedLuthiers: many(favoriteLuthiers, { relationName: 'savedLuthier' }),
  luthierReviewsAsAuthor: many(luthierReviews, { relationName: 'reviewAuthor' }),
  luthierReviewsAsTarget: many(luthierReviews, { relationName: 'reviewedLuthier' }),
  leadsForLuthier: many(luthierLeads, { relationName: 'leadsForLuthier' }),
  leadsReferedByMe: many(luthierLeads, { relationName: 'leadReferrer' }),
  portfolioItems: many(luthierPortfolio, { relationName: 'portfolioOfLuthier' }),
  passwordChangeAttempts: many(passwordChangeAttempts),
}));

export const businessDirectoryRelations = relations(businessDirectory, ({ one }) => ({
  user: one(userProfiles, {
    fields: [businessDirectory.userId],
    references: [userProfiles.id],
  }),
}));

export const stringsCatalogRelations = relations(stringsCatalog, ({ many }) => ({
  reviews: many(stringReviews),
  favorites: many(favoriteStrings),
}));

export const stringReviewsRelations = relations(stringReviews, ({ one }) => ({
  string: one(stringsCatalog, {
    fields: [stringReviews.stringId],
    references: [stringsCatalog.id],
  }),
  user: one(userProfiles, {
    fields: [stringReviews.userId],
    references: [userProfiles.id],
  }),
}));

export const favoriteStrings = pgTable(
  'favorite_strings',
  {
    userId: uuid('user_id')
      .references(() => userProfiles.id)
      .notNull(),
    stringId: uuid('string_id')
      .references(() => stringsCatalog.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      name: 'favorite_strings_user_id_string_id_pk',
      columns: [table.userId, table.stringId],
    }),
  ]
);

export const favoriteLuthiers = pgTable(
  'favorite_luthiers',
  {
    userId: uuid('user_id')
      .references(() => userProfiles.id)
      .notNull(),
    luthierId: uuid('luthier_id')
      .references(() => userProfiles.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      name: 'favorite_luthiers_user_id_luthier_id_pk',
      columns: [table.userId, table.luthierId],
    }),
  ]
);

export const favoriteBusinesses = pgTable(
  'favorite_businesses',
  {
    userId: uuid('user_id')
      .references(() => userProfiles.id)
      .notNull(),
    businessId: uuid('business_id')
      .references(() => businessDirectory.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      name: 'favorite_businesses_user_id_business_id_pk',
      columns: [table.userId, table.businessId],
    }),
  ]
);

export const favoriteProfessors = pgTable(
  'favorite_professors',
  {
    userId: uuid('user_id')
      .references(() => userProfiles.id)
      .notNull(),
    professorId: uuid('professor_id')
      .references(() => userProfiles.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      name: 'favorite_professors_user_id_professor_id_pk',
      columns: [table.userId, table.professorId],
    }),
  ]
);

export const favoriteStringsRelations = relations(favoriteStrings, ({ one }) => ({
  user: one(userProfiles, {
    fields: [favoriteStrings.userId],
    references: [userProfiles.id],
  }),
  string: one(stringsCatalog, {
    fields: [favoriteStrings.stringId],
    references: [stringsCatalog.id],
  }),
}));

export const favoriteLuthiersRelations = relations(favoriteLuthiers, ({ one }) => ({
  user: one(userProfiles, {
    fields: [favoriteLuthiers.userId],
    references: [userProfiles.id],
    relationName: 'favoritedByUser',
  }),
  luthier: one(userProfiles, {
    fields: [favoriteLuthiers.luthierId],
    references: [userProfiles.id],
    relationName: 'savedLuthier',
  }),
}));

export const favoriteBusinessesRelations = relations(favoriteBusinesses, ({ one }) => ({
  user: one(userProfiles, {
    fields: [favoriteBusinesses.userId],
    references: [userProfiles.id],
  }),
  business: one(businessDirectory, {
    fields: [favoriteBusinesses.businessId],
    references: [businessDirectory.id],
  }),
}));

export const favoriteProfessorsRelations = relations(favoriteProfessors, ({ one }) => ({
  user: one(userProfiles, {
    fields: [favoriteProfessors.userId],
    references: [userProfiles.id],
    relationName: 'favoritingUser',
  }),
  professor: one(userProfiles, {
    fields: [favoriteProfessors.professorId],
    references: [userProfiles.id],
    relationName: 'savedProfessor',
  }),
}));

// Reputação B2B: músicos avaliam luthiers. A unicidade composta impede que um
// mesmo autor avalie um mesmo profissional mais de uma vez a nível de banco.
export const luthierReviews = pgTable(
  'luthier_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    luthierId: uuid('luthier_id')
      .references(() => userProfiles.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => userProfiles.id)
      .notNull(),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('luthier_reviews_luthier_id_user_id_unique').on(table.luthierId, table.userId),
  ]
);

export const luthierReviewsRelations = relations(luthierReviews, ({ one }) => ({
  luthier: one(userProfiles, {
    fields: [luthierReviews.luthierId],
    references: [userProfiles.id],
    relationName: 'reviewedLuthier',
  }),
  user: one(userProfiles, {
    fields: [luthierReviews.userId],
    references: [userProfiles.id],
    relationName: 'reviewAuthor',
  }),
}));

export const luthierLeads = pgTable('luthier_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  luthierId: uuid('luthier_id')
    .references(() => userProfiles.id)
    .notNull(),
  userId: uuid('user_id').references(() => userProfiles.id),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const luthierPortfolio = pgTable('luthier_portfolio', {
  id: uuid('id').primaryKey().defaultRandom(),
  luthierId: uuid('luthier_id')
    .references(() => userProfiles.id)
    .notNull(),
  imageUrl: text('image_url').notNull(),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const luthierLeadsRelations = relations(luthierLeads, ({ one }) => ({
  luthier: one(userProfiles, {
    fields: [luthierLeads.luthierId],
    references: [userProfiles.id],
    relationName: 'leadsForLuthier',
  }),
  user: one(userProfiles, {
    fields: [luthierLeads.userId],
    references: [userProfiles.id],
    relationName: 'leadReferrer',
  }),
}));

export const luthierPortfolioRelations = relations(luthierPortfolio, ({ one }) => ({
  luthier: one(userProfiles, {
    fields: [luthierPortfolio.luthierId],
    references: [userProfiles.id],
    relationName: 'portfolioOfLuthier',
  }),
}));

/**
 * Rate limiting distributo (POST /api/auth/change-password).
 * Uma linha por usuario: contagem de tentativas + janelas de cooldown com
 * exponential backoff. Persistido no Postgres (compartilhado entre todas as
 * instancias/servers) em vez de um Map em memoria — o mesmo contrato que o
 * Upstash Redis cumpriria, sem dependencia externa nova.
 */
export const passwordChangeAttempts = pgTable('password_change_attempts', {
  userId: uuid('user_id').primaryKey().references(() => userProfiles.id),
  attemptCount: integer('attempt_count').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at').defaultNow().notNull(),
  lastSuccessAt: timestamp('last_success_at'),
});

export const passwordChangeAttemptsRelations = relations(
  passwordChangeAttempts,
  ({ one }) => ({
    user: one(userProfiles, {
      fields: [passwordChangeAttempts.userId],
      references: [userProfiles.id],
    }),
  })
);

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending',
  'confirmed',
  'completed',
  'canceled',
]);

export const professorAvailability = pgTable('professor_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  professorId: uuid('professor_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
}, (table) => [
  check('professor_availability_day_of_week_check', sql`${table.dayOfWeek} between 0 and 6`),
]);

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  professorId: uuid('professor_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  status: appointmentStatusEnum('status').notNull().default('pending'),
  dailyRoomUrl: text('daily_room_url'),
  paymentId: text('payment_id'),
});

export const professorAvailabilityRelations = relations(professorAvailability, ({ one }) => ({
  professor: one(userProfiles, {
    fields: [professorAvailability.professorId],
    references: [userProfiles.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  student: one(users, {
    fields: [appointments.studentId],
    references: [users.id],
  }),
  professor: one(userProfiles, {
    fields: [appointments.professorId],
    references: [userProfiles.id],
  }),
}));

export const classBookingStatusEnum = pgEnum('class_booking_status', [
  'pending',
  'confirmed',
  'cancelled',
]);

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid']);
export const classPlanModalityEnum = pgEnum('class_plan_modality', ['single', 'monthly', 'semiannual', 'annual']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'exhausted', 'cancelled', 'expired']);

export const studentPlanEnrollments = pgTable('student_plan_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  teacherId: uuid('teacher_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  modality: classPlanModalityEnum('modality').notNull(),
  totalCredits: integer('total_credits').notNull(),
  usedCredits: integer('used_credits').notNull().default(0),
  pricePaidCents: integer('price_paid_cents').notNull(),
  platformFeeCents: integer('platform_fee_cents').notNull(),
  status: enrollmentStatusEnum('status').notNull().default('active'),
  mpPaymentId: text('mp_payment_id'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teacherAvailability = pgTable('teacher_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => [
  check('teacher_availability_day_of_week_check', sql`${table.dayOfWeek} between 0 and 6`),
]);

export const classBookings = pgTable('class_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  teacherId: uuid('teacher_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  status: classBookingStatusEnum('status').notNull().default('pending'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  meetingUrl: text('meeting_url'),
  priceCents: integer('price_cents').notNull().default(15000),
  platformFeeCents: integer('platform_fee_cents').notNull().default(1500),
  planModality: classPlanModalityEnum('plan_modality').notNull().default('single'),
  enrollmentId: uuid('enrollment_id').references(() => studentPlanEnrollments.id),
  teacherNetCents: integer('teacher_net_cents').notNull().default(14250),
  cancelledAt: timestamp('cancelled_at'),
  reminderSentAt: timestamp('reminder_sent_at'),
  completedAt: timestamp('completed_at'),
});

export const teacherAvailabilityRelations = relations(teacherAvailability, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherAvailability.teacherId],
    references: [users.id],
  }),
}));

export const classBookingsRelations = relations(classBookings, ({ one }) => ({
  student: one(users, {
    fields: [classBookings.studentId],
    references: [users.id],
    relationName: 'studentBookings',
  }),
  teacher: one(users, {
    fields: [classBookings.teacherId],
    references: [users.id],
    relationName: 'teacherBookings',
  }),
  enrollment: one(studentPlanEnrollments, {
    fields: [classBookings.enrollmentId],
    references: [studentPlanEnrollments.id],
  }),
}));

export const studentPlanEnrollmentRelations = relations(studentPlanEnrollments, ({ one, many }) => ({
  student: one(users, { fields: [studentPlanEnrollments.studentId], references: [users.id] }),
  teacher: one(users, { fields: [studentPlanEnrollments.teacherId], references: [users.id] }),
  bookings: many(classBookings),
}));

export const reviewVisibilityEnum = pgEnum('review_visibility', ['public', 'teacher_only', 'admin_only']);
export const reportTargetTypeEnum = pgEnum('report_target_type', ['student', 'teacher', 'store', 'luthier']);
export const reportReasonEnum = pgEnum('report_reason', ['fraud', 'harassment', 'no_show', 'inappropriate_content', 'commercial_violation', 'other']);
export const reportStatusEnum = pgEnum('report_status', ['open', 'under_review', 'resolved', 'dismissed']);

export const teacherReviews = pgTable('teacher_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').references(() => classBookings.id, { onDelete: 'cascade' }).notNull().unique(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  teacherId: uuid('teacher_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  visibility: reviewVisibilityEnum('visibility').notNull().default('public'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entityReports = pgTable('entity_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetType: reportTargetTypeEnum('target_type').notNull(),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  targetDirectoryId: uuid('target_directory_id').references(() => businessDirectory.id, { onDelete: 'set null' }),
  bookingId: uuid('booking_id').references(() => classBookings.id, { onDelete: 'set null' }),
  reason: reportReasonEnum('reason').notNull(),
  details: text('details').notNull(),
  status: reportStatusEnum('status').notNull().default('open'),
  adminNotes: text('admin_notes'),
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type UserProfile = InferSelectModel<typeof userProfiles>;
export type NewUserProfile = InferInsertModel<typeof userProfiles>;
export type ClassBooking = InferSelectModel<typeof classBookings>;
export type NewClassBooking = InferInsertModel<typeof classBookings>;
export type GuidePurchase = InferSelectModel<typeof guidePurchases>;
export type NewGuidePurchase = InferInsertModel<typeof guidePurchases>;
export type GuideSubscription = InferSelectModel<typeof guideSubscriptions>;
export type NewGuideSubscription = InferInsertModel<typeof guideSubscriptions>;