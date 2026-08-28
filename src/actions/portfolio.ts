'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles, luthierPortfolio } from '@/db/schema';
import { isUuid } from '@/lib/uuid';

async function requireLuthierId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== 'luthier') {
    throw new Error('Acesso restrito. Habilite o perfil de luthier primeiro.');
  }

  return user.id;
}

export type PortfolioItem = {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  createdAt: Date;
};

export async function addPortfolioItem(formData: FormData): Promise<void> {
  const luthierId = await requireLuthierId();

  const imageUrl = trimValue(formData.get('imageUrl'));
  const title = trimValue(formData.get('title'));
  const description = trimValue(formData.get('description'));

  if (!imageUrl) {
    throw new Error('A URL da imagem é obrigatória.');
  }

  await db.insert(luthierPortfolio).values({
    luthierId,
    imageUrl,
    title: title || null,
    description: description || null,
  });

  revalidatePath('/dashboard/luthier');
  revalidatePath(`/luthiers/${luthierId}`);
}

export async function deletePortfolioItem(formData: FormData): Promise<void> {
  const luthierId = await requireLuthierId();

  const rawItemId = formData.get('itemId');
  const itemId = typeof rawItemId === 'string' ? rawItemId : '';

  if (!isUuid(itemId)) return;

  // Garantia de propriedade: apenas o dono (luthier da sessão) deleta.
  await db
    .delete(luthierPortfolio)
    .where(
      and(eq(luthierPortfolio.id, itemId), eq(luthierPortfolio.luthierId, luthierId))
    );

  revalidatePath('/dashboard/luthier');
  revalidatePath(`/luthiers/${luthierId}`);
}

export async function getLuthierPortfolio(luthierId: string): Promise<PortfolioItem[]> {
  // Fronteira de injeção: UUID malformado nunca deve atingir o Postgres.
  if (!isUuid(luthierId)) return [];

  const rows = await db
    .select({
      id: luthierPortfolio.id,
      imageUrl: luthierPortfolio.imageUrl,
      title: luthierPortfolio.title,
      description: luthierPortfolio.description,
      createdAt: luthierPortfolio.createdAt,
    })
    .from(luthierPortfolio)
    .where(eq(luthierPortfolio.luthierId, luthierId))
    .orderBy(desc(luthierPortfolio.createdAt));

  return rows;
}

function trimValue(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}