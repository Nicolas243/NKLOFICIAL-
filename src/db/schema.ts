import { pgTable, text, timestamp, numeric, integer, uuid, varchar, unique, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const newsFeed = pgTable('news_feed', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  tags: varchar('tags', { length: 255 }), 
  imageUrl: text('image_url').notNull(),
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

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  businessDirectory: many(businessDirectory),
  subscriptions: many(subscriptions),
  stringReviews: many(stringReviews),
  favoriteStrings: many(favoriteStrings),
  favoriteLuthiersAsUser: many(favoriteLuthiers, { relationName: 'favoritedByUser' }),
  savedLuthiers: many(favoriteLuthiers, { relationName: 'savedLuthier' }),
  luthierReviewsAsAuthor: many(luthierReviews, { relationName: 'reviewAuthor' }),
  luthierReviewsAsTarget: many(luthierReviews, { relationName: 'reviewedLuthier' }),
  leadsForLuthier: many(luthierLeads, { relationName: 'leadsForLuthier' }),
  leadsReferedByMe: many(luthierLeads, { relationName: 'leadReferrer' }),
  portfolioItems: many(luthierPortfolio, { relationName: 'portfolioOfLuthier' }),
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