'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { userProfiles, businessDirectory } from '@/db/schema';

export type LuthierDetails = {
  id: string;
  fullName: string | null;
  businessName: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  planType: string | null;
  whatsapp: string | null;
};

export async function getLuthierDetails(id: string): Promise<LuthierDetails | null> {
  if (!id) return null;

  const [row] = await db
    .select({
      id: userProfiles.id,
      fullName: userProfiles.fullName,
      businessName: userProfiles.businessName,
      profileCity: userProfiles.city,
      profileState: userProfiles.state,
      bio: userProfiles.bio,
      role: userProfiles.role,
      bizBusinessName: businessDirectory.businessName,
      bizCity: businessDirectory.city,
      bizState: businessDirectory.state,
      planType: businessDirectory.planType,
      whatsapp: businessDirectory.whatsapp,
    })
    .from(userProfiles)
    .leftJoin(businessDirectory, eq(businessDirectory.userId, userProfiles.id))
    .where(eq(userProfiles.id, id))
    .limit(1);

  // Apenas luthiers têm perfil público no diretório; não encontrado => null.
  if (!row || row.role !== 'luthier') return null;

  return {
    id: row.id,
    fullName: row.fullName,
    businessName: row.bizBusinessName ?? row.businessName,
    city: row.bizCity ?? row.profileCity,
    state: row.bizState ?? row.profileState,
    bio: row.bio,
    planType: row.planType,
    whatsapp: row.whatsapp,
  };
}