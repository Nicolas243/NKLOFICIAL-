'use server'

import { db } from '@/db'
import { newsSuggestions } from '@/db/schema'
import { revalidatePath } from 'next/cache'

/** Tarefa 9 — sanitização anti-code-injection refletida (XSS). */
function sanitize(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#39;)/g, '&amp;')
}

/** Valida URL http(s) para o campo de imagem. */
function validImageUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? value : null
  } catch {
    return null
  }
}

export async function submitNewsSuggestion(formData: FormData) {
  const rawTitle = (formData.get('title') as string)?.trim() ?? ''
  const rawContent = (formData.get('contentOrLink') as string)?.trim() ?? ''
  const rawSuggested = (formData.get('suggestedBy') as string)?.trim() || null
  const image1 = (formData.get('image1') as string)?.trim() || ''
  const image2 = (formData.get('image2') as string)?.trim() || ''

  const title = sanitize(rawTitle)
  const content = sanitize(rawContent)

  if (!title || !content) {
    return { success: false, message: 'Título e conteúdo são obrigatórios.' }
  }
  if (title.length > 255) {
    return { success: false, message: 'Título muito longo (máx. 255 caracteres).' }
  }
  if (content.length < 10) {
    return { success: false, message: 'Conteúdo muito curto (mín. 10 caracteres).' }
  }

  // Imagens: 1 a 2, opcionais, apenas URLs http(s) válidas (evita javascript:).
  const images: string[] = []
  const candidate1 = validImageUrl(image1)
  if (candidate1) images.push(candidate1)
  const candidate2 = validImageUrl(image2)
  if (candidate2 && images.length < 2) images.push(candidate2)

  await db.insert(newsSuggestions).values({
    title,
    contentOrLink: content,
    suggestedBy: rawSuggested ? sanitize(rawSuggested) : null,
    imageUrl: images[0] ?? null,
    status: 'pending',
  })

  revalidatePath('/noticias')
  return { success: true, message: 'Anúncio enviado para aprovação! Nossa equipe vai analisar.' }
}