'use server';

import { eq, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isUndefinedTableError } from '@/lib/entitlements';
import { db } from '@/db';
import {
  userProfiles,
  userEntitlements,
  businessDirectory,
  aiAccessGrants,
  aiLearningProgress,
  savedPartnerPrograms,
  guidePurchases,
  guideSubscriptions,
  adCampaigns,
  favoriteStrings,
  favoriteLuthiers,
  favoriteBusinesses,
  favoriteProfessors,
  stringReviews,
  luthierReviews,
  luthierLeads,
  luthierPortfolio,
  newsComments,
  newsLikes,
  subscriptions,
  notifications,
  passwordChangeAttempts,
} from '@/db/schema';

async function readUserEntitlementsForExport(userId: string) {
  try {
    return await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, userId));
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return [];
    }
    throw error;
  }
}

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

  const [
    profileRows,
    entitlements,
    aiGrants,
    aiProgress,
    savedPrograms,
    gPurchases,
    gSubscriptions,
    campaigns,
    favStrings,
    favLuthiers,
    favBusinesses,
    favProfessors,
    sReviews,
    lReviews,
    nComments,
    nLikes,
    notifs,
  ] = await Promise.all([
    db.select().from(userProfiles).where(eq(userProfiles.id, user.id)),
    readUserEntitlementsForExport(user.id),
    db.select().from(aiAccessGrants).where(eq(aiAccessGrants.userId, user.id)),
    db.select().from(aiLearningProgress).where(eq(aiLearningProgress.userId, user.id)),
    db.select().from(savedPartnerPrograms).where(eq(savedPartnerPrograms.userId, user.id)),
    db.select().from(guidePurchases).where(eq(guidePurchases.userId, user.id)),
    db.select().from(guideSubscriptions).where(eq(guideSubscriptions.userId, user.id)),
    db.select().from(adCampaigns).where(eq(adCampaigns.userId, user.id)),
    db.select().from(favoriteStrings).where(eq(favoriteStrings.userId, user.id)),
    db.select().from(favoriteLuthiers).where(eq(favoriteLuthiers.userId, user.id)),
    db.select().from(favoriteBusinesses).where(eq(favoriteBusinesses.userId, user.id)),
    db.select().from(favoriteProfessors).where(eq(favoriteProfessors.userId, user.id)),
    db.select().from(stringReviews).where(eq(stringReviews.userId, user.id)),
    db.select().from(luthierReviews).where(eq(luthierReviews.userId, user.id)),
    db.select().from(newsComments).where(eq(newsComments.userId, user.id)),
    db.select().from(newsLikes).where(eq(newsLikes.userId, user.id)),
    db.select().from(notifications).where(eq(notifications.userId, user.id)),
  ]);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile: profileRows[0] ?? null,
      userEntitlements: entitlements,
      aiAccessGrants: aiGrants,
      aiLearningProgress: aiProgress,
      savedPartnerPrograms: savedPrograms,
      guidePurchases: gPurchases.map((row) => ({
        ...row,
        encryptedCpf: null,
        guestAccessTokenHash: null,
      })),
      guideSubscriptions: gSubscriptions.map((row) => ({
        ...row,
        encryptedCpf: null,
        guestAccessTokenHash: null,
      })),
      adCampaigns: campaigns,
      favoriteStrings: favStrings,
      favoriteLuthiers: favLuthiers,
      favoriteBusinesses: favBusinesses,
      favoriteProfessors: favProfessors,
      stringReviews: sReviews,
      luthierReviews: lReviews,
      newsComments: nComments,
      newsLikes: nLikes,
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
      // Acesso e progresso em produtos digitais, programas salvos e campanhas.
      try {
        await tx.transaction(async (savepointTx) => {
          await savepointTx.delete(userEntitlements).where(eq(userEntitlements.userId, userId));
        });
      } catch (entitlementError) {
        if (!isUndefinedTableError(entitlementError)) {
          throw entitlementError;
        }
      }
      await tx.delete(aiLearningProgress).where(eq(aiLearningProgress.userId, userId));
      await tx.delete(aiAccessGrants).where(eq(aiAccessGrants.userId, userId));
      await tx.delete(savedPartnerPrograms).where(eq(savedPartnerPrograms.userId, userId));
      await tx.delete(guidePurchases).where(eq(guidePurchases.userId, userId));
      await tx.delete(guideSubscriptions).where(eq(guideSubscriptions.userId, userId));
      await tx.delete(adCampaigns).where(eq(adCampaigns.userId, userId));

      // Favoritos: como autor e tambem como alvo (perfis e estabelecimentos favoritados).
      await tx.delete(favoriteStrings).where(eq(favoriteStrings.userId, userId));
      await tx.delete(favoriteLuthiers).where(eq(favoriteLuthiers.userId, userId));
      await tx.delete(favoriteLuthiers).where(eq(favoriteLuthiers.luthierId, userId));
      await tx.delete(favoriteProfessors).where(eq(favoriteProfessors.userId, userId));
      await tx.delete(favoriteProfessors).where(eq(favoriteProfessors.professorId, userId));
      await tx.delete(favoriteBusinesses).where(eq(favoriteBusinesses.userId, userId));

      const ownedBusinesses = await tx
        .select({ id: businessDirectory.id })
        .from(businessDirectory)
        .where(eq(businessDirectory.userId, userId));
      if (ownedBusinesses.length > 0) {
        await tx
          .delete(favoriteBusinesses)
          .where(inArray(favoriteBusinesses.businessId, ownedBusinesses.map((item) => item.id)));
      }

      // Engajamento editorial (comentarios e curtidas em noticias).
      await tx.delete(newsComments).where(eq(newsComments.userId, userId));
      await tx.delete(newsLikes).where(eq(newsLikes.userId, userId));

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

