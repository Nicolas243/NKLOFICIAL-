'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles, luthierPortfolio } from '@/db/schema';
import { isUuid } from '@/lib/uuid';

const PORTFOLIO_BUCKET = 'public-assets';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

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

  const raw = formData.get('image');
  const file = raw instanceof File ? raw : null;

  // Validação de imagem (Inversion Thinking): qualquer condição inválida
  // interrompe a execução sem tocar no banco nem no storage.
  if (!file || file.size === 0) {
    throw new Error('Envie um arquivo de imagem válido.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo precisa ser uma imagem (JPEG, PNG ou WebP).');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('A imagem excede o limite de 5MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const title = trimValue(formData.get('title'));
  const description = trimValue(formData.get('description'));

  const supabase = await createClient();

  // Caminho único para evitar colisões e o reuse de mesmo nome de arquivo.
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'png';
  const objectKey = `luthiers/${luthierId}/${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(objectKey, file, { contentType: file.type });

  if (uploadError) {
    console.error('Falha no upload de storage:', uploadError.message);
    throw new Error('Não foi possível enviar a imagem. Tente novamente.');
  }

  const { data: publicUrlData } = supabase.storage
    .from(PORTFOLIO_BUCKET)
    .getPublicUrl(objectKey);

  const imageUrl = publicUrlData.publicUrl;

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