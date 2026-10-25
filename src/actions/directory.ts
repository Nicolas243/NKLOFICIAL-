'use server';

import { eq, asc, and, or, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { userProfiles, businessDirectory } from '@/db/schema';

/**
 * Card comum do diretório (Tarefa 12): foto, apresentação, tipos de
 * instrumentos atendidos, tipos de reparos e local. Tabelas de preços
 * nunca são expostas aqui — o contato direto fica atrás do auth wall.
 */
export type DirectoryCard = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  planType: string;
  whatsapp: string | null;
  bio: string | null;
  imageUrl: string | null;
  instrumentTypes: string | null;
  repairTypes: string | null;
};

export type LuthierCard = DirectoryCard;

const directorySelection = {
  id: userProfiles.id,
  fullName: userProfiles.fullName,
  profileBusinessName: userProfiles.businessName,
  profileBio: userProfiles.bio,
  profileCity: userProfiles.city,
  profileState: userProfiles.state,
  businessName: businessDirectory.businessName,
  businessCity: businessDirectory.city,
  businessState: businessDirectory.state,
  planType: businessDirectory.planType,
  whatsapp: businessDirectory.whatsapp,
  imageUrl: businessDirectory.imageUrl,
  instrumentTypes: businessDirectory.instrumentTypes,
  repairTypes: businessDirectory.repairTypes,
};

function toDirectoryCard(row: {
  id: string;
  fullName: string | null;
  profileBusinessName: string | null;
  profileBio: string | null;
  profileCity: string | null;
  profileState: string | null;
  businessName: string | null;
  businessCity: string | null;
  businessState: string | null;
  planType: string | null;
  whatsapp: string | null;
  imageUrl: string | null;
  instrumentTypes: string | null;
  repairTypes: string | null;
}): DirectoryCard {
  return {
    id: row.id,
    name: row.businessName ?? row.profileBusinessName ?? row.fullName ?? 'Profissional',
    city: row.businessCity ?? row.profileCity,
    state: row.businessState ?? row.profileState,
    planType: row.planType ?? 'free',
    whatsapp: row.whatsapp,
    bio: row.profileBio,
    imageUrl: row.imageUrl,
    instrumentTypes: row.instrumentTypes,
    repairTypes: row.repairTypes,
  };
}

export async function getLuthiersDirectory(): Promise<LuthierCard[]> {
  const rows = await db
    .select(directorySelection)
    .from(userProfiles)
    .leftJoin(businessDirectory, eq(businessDirectory.userId, userProfiles.id))
    .where(and(eq(userProfiles.role, 'luthier'), eq(userProfiles.isSuspended, false), or(isNull(businessDirectory.isSuspended), eq(businessDirectory.isSuspended, false))))
    .orderBy(asc(userProfiles.createdAt));

  return rows.map(toDirectoryCard);
}

export async function getBusinessesDirectory(): Promise<DirectoryCard[]> {
  const rows = await db
    .select(directorySelection)
    .from(userProfiles)
    .leftJoin(businessDirectory, eq(businessDirectory.userId, userProfiles.id))
    .where(and(eq(userProfiles.role, 'lojista'), eq(userProfiles.isSuspended, false), or(isNull(businessDirectory.isSuspended), eq(businessDirectory.isSuspended, false))))
    .orderBy(asc(userProfiles.createdAt));

  return rows.map(toDirectoryCard);
}

export type ProfessorCard = {
  id: string;
  name: string;
  bio: string | null;
  instrumento: string | null;
  anosExperiencia: number | null;
  city: string | null;
  state: string | null;
  planType: string;
};

/**
 * Tarefa 13 — diretório de professores. O cadastro de professor usa
 * `papel = 'Professor'` em `user_profiles` (a `role` fica 'user'), por isso
 * o filtro é pelo papel, e não pela role.
 */
export async function getProfessorsDirectory(): Promise<ProfessorCard[]> {
  const rows = await db
    .select({
      id: userProfiles.id,
      fullName: userProfiles.fullName,
      businessName: userProfiles.businessName,
      bio: userProfiles.bio,
      instrumento: userProfiles.instrumento,
      anosExperiencia: userProfiles.anosExperiencia,
      city: userProfiles.city,
      state: userProfiles.state,
      planType: userProfiles.planType,
    })
    .from(userProfiles)
    .where(and(eq(userProfiles.papel, 'Professor'), eq(userProfiles.isSuspended, false)))
    .orderBy(asc(userProfiles.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.businessName ?? row.fullName ?? 'Professor(a)',
    bio: row.bio,
    instrumento: row.instrumento,
    anosExperiencia: row.anosExperiencia,
    city: row.city,
    state: row.state,
    planType: row.planType ?? 'free',
  }));
}