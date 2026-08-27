import { pgTable, text, timestamp, numeric, integer, uuid, varchar } from 'drizzle-orm/pg-core';
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  businessDirectory: many(businessDirectory),
}));

export const businessDirectoryRelations = relations(businessDirectory, ({ one }) => ({
  user: one(userProfiles, {
    fields: [businessDirectory.userId],
    references: [userProfiles.id],
  }),
}));