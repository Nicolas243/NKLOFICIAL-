import { db } from '@/db';
import { notifications } from '@/db/schema';

type BookingNotificationInput = {
  userId: string;
  title: string;
  message: string;
  link?: string;
};

export async function createBookingNotification(input: BookingNotificationInput): Promise<void> {
  await db.insert(notifications).values({
    userId: input.userId,
    type: 'booking',
    title: input.title,
    message: input.message,
    relatedId: input.link?.match(/[0-9a-f-]{36}$/i)?.[0],
  });
}
