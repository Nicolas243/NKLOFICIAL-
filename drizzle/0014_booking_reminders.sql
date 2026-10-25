ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamp;
CREATE INDEX IF NOT EXISTS "class_bookings_reminder_window_idx"
  ON "class_bookings" ("status", "payment_status", "scheduled_at", "reminder_sent_at");
