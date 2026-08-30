'use server'

import { db } from '@/db'
import { newsSuggestions } from '@/db/schema'
import { revalidatePath } from 'next/cache'

export async function submitNewsSuggestion(formData: FormData) {
  const title = (formData.get('title') as string)?.trim()
  const contentOrLink = (formData.get('contentOrLink') as string)?.trim()
  const suggestedBy = (formData.get('suggestedBy') as string)?.trim() || null

  if (!title || !contentOrLink) {
    return { success: false, message: 'Título e conteúdo são obrigatórios.' }
  }
  if (title.length > 255) {
    return { success: false, message: 'Título muito longo (máx. 255 caracteres).' }
  }
  if (contentOrLink.length < 10) {
    return { success: false, message: 'Conteúdo muito curto (mín. 10 caracteres).' }
  }

  await db.insert(newsSuggestions).values({
    title,
    contentOrLink,
    suggestedBy,
    status: 'pending',
  })

  revalidatePath('/noticias')
  return { success: true, message: 'Sugestão enviada com sucesso! Nossa equipe vai analisar.' }
}