CREATE TYPE "public"."class_booking_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid');--> statement-breakpoint
CREATE TABLE "teacher_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "teacher_availability_day_of_week_check" CHECK ("teacher_availability"."day_of_week" between 0 and 6)
);--> statement-breakpoint
CREATE TABLE "class_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "public"."class_booking_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "public"."payment_status" DEFAULT 'pending' NOT NULL,
	"meeting_url" text
);--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
