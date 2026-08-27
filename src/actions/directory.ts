'use server';

import { eq, asc } from 'drizzle-orm';
import { db } from '@/db';
import { userProfiles, businessDirectory } from '@/db/schema';

export type LuthierCard = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  planType: string;
  whatsapp: string | null;
};

export async function getLuthiersDirectory(): Promise<LuthierCard[]> {
  const rows = await db
    .select({
      id: userProfiles.id,
      fullName: userProfiles.fullName,
      profileBusinessName: userProfiles.businessName,
      profileCity: userProfiles.city,
      profileState: userProfiles.state,
      businessName: businessDirectory.businessName,
      businessCity: businessDirectory.city,
      businessState: businessDirectory.state,
      planType: businessDirectory.planType,
      whatsapp: businessDirectory.whatsapp,
    })
    .from(userProfiles)
    .leftJoin(businessDirectory, eq(businessDirectory.userId, userProfiles.id))
    .where(eq(userProfiles.role, 'luthier'))
    .orderBy(asc(userProfiles.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.businessName ?? row.profileBusinessName ?? row.fullName ?? 'Profissional',
    city: row.businessCity ?? row.profileCity,
    state: row.businessState ?? row.profileState,
    planType: row.planType ?? 'free',
    whatsapp: row.whatsapp,
  }));
}