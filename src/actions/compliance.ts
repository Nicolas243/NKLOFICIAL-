'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import {
  userProfiles,
  businessDirectory,
  favoriteStrings,
  favoriteLuthiers,
  stringReviews,
  luthierReviews,
  luthierLeads,
  luthierPortfolio,
  subscriptions,
  notifications,
  passwordChangeAttempts,
} from '@/db/schema';

/**
 * Portabilidade de dados (LGPD/GDPR — Art. 18): retorna um snapshot JSON de
 * todos os dados vinculados ao usuário autenticado.
 */
export async function exportUserData(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  const [profileRows, favStrings, favLuthiers, sReviews, lReviews, notifs] = await Promise.all([
    db.select().from(userProfiles).where(eq(userProfiles.id, user.id)),
    db.select().from(favoriteStrings).where(eq(favoriteStrings.userId, user.id)),
    db.select().from(favoriteLuthiers).where(eq(favoriteLuthiers.userId, user.id)),
    db.select().from(stringReviews).where(eq(stringReviews.userId, user.id)),
    db.select().from(luthierReviews).where(eq(luthierReviews.userId, user.id)),
    db.select().from(notifications).where(eq(notifications.userId, user.id)),
  ]);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile: profileRows[0] ?? null,
      favoriteStrings: favStrings,
      favoriteLuthiers: favLuthiers,
      stringReviews: sReviews,
      luthierReviews: lReviews,
      notifications: notifs,
    },
    null,
    2
  );
}

/**
 * Direito ao esquecimento (LGPD/GDPR — Art. 16). Sem service role disponível,
 * aplicamos anonimização lógica: o registro é preservado para não violar as
 * FKs do histórico de avaliações/leads, mas todos os campos identificáveis
 * são higienados — tanto no perfil quanto na vitrine comercial pública.
 */

/**
 * Direito ao esquecimento (LGPD/GDPR - Art. 16).
 *
 * Estrategia em camadas:
 * 1. TENTATIVA DE EXCLUSAO REAL - transacao atomica que derruba todo o grafo
 *    de dependencias do usuario (assinaturas, favoritos, avaliacoes, leads,
 *    portfolio, vitrine e perfil). As tabelas `luthier_leads`,
 *    `luthier_reviews` e `subscriptions` eram residuos identificaveis no
 *    modelo antigo (anonimizacao logica) e agora tambem sao removidas.
 *    Linhas de TERCEIROS que apontem para este usuario (ex.: um lead/review
 *    deixado para o luthier) sao tratadas nos dois sentidos (autor e alvo).
 * 2. FALLBACK - se alguma FK residual impedir a remocao do perfil (dado de
 *    terceiro ainda referenciando), a transacao e revertida e a anonimizacao
 *    higieniza o perfil e a vitrine sem deixar PII (comportamento anterior,
 *    preservado por seguranca).
 */
export async function deleteUserAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login');
  }

  const userId = user.id;

  try {
    await db.transaction(async (tx) => {
      // Favoritos: como autor e tambem como alvo (perfis favoritados).
      await tx.delete(favoriteLuthiers).where(eq(favoriteLuthiers.userId, userId));
      await tx.delete(favoriteLuthiers).where(eq(favoriteLuthiers.luthierId, userId));

      // Avaliacoes: como autor e como alvo (reputacao do luthier).
      await tx.delete(stringReviews).where(eq(stringReviews.userId, userId));
      await tx.delete(luthierReviews).where(eq(luthierReviews.userId, userId));
      await tx.delete(luthierReviews).where(eq(luthierReviews.luthierId, userId));

      // Leads comerciais: como origem e como destino.
      await tx.delete(luthierLeads).where(eq(luthierLeads.userId, userId));
      await tx.delete(luthierLeads).where(eq(luthierLeads.luthierId, userId));

      // Conteudo e plano financeiro.
      await tx.delete(luthierPortfolio).where(eq(luthierPortfolio.luthierId, userId));
      await tx.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await tx.delete(notifications).where(eq(notifications.userId, userId));

      // Vitrine publica (fonte do diretorio).
      await tx.delete(businessDirectory).where(eq(businessDirectory.userId, userId));

      // Metadados de rate limit (tracos de tentativas de troca de senha).
      await tx.delete(passwordChangeAttempts).where(eq(passwordChangeAttempts.userId, userId));

      // Perfil de identidade - a remocao so ocorre se o grafo interno estiver
      // 100% limpo acima (FKs de user_profiles sem acao ON DELETE).
      await tx.delete(userProfiles).where(eq(userProfiles.id, userId));
    });
  } catch (error) {
    console.warn(
      '[deleteUserAccount] Exclusao real indisponivel (dado de terceiro referenciando o perfil?), aplicando anonimizacao:',
      error
    );

    // FALLBACK LGPD: anonimizacao logica identica ao comportamento anterior.
    await db
      .update(userProfiles)
      .set({
        email: `anon_${user.id}@anonimizado.local`,
        fullName: 'Usuario Anonimizado',
        businessName: null,
        city: null,
        state: null,
        bio: null,
      })
      .where(eq(userProfiles.id, userId));

    await db
      .update(businessDirectory)
      .set({
        businessName: 'Estabelecimento Anonimizado',
        city: 'Anonimizado',
        state: 'NA',
        whatsapp: null,
      })
      .where(eq(businessDirectory.userId, userId));
  }

  // Encerra a sessao e expulsa o usuario da plataforma.
  await supabase.auth.signOut();

  revalidatePath('/');
  redirect('/login');
}

