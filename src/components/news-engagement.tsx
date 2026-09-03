'use client';

import { useState, useTransition } from 'react';
import { toggleNewsLike, submitNewsComment } from '@/actions/news';

type CommentItem = {
  id: string;
  authorName: string;
  comment: string;
  createdAt: Date;
};

/**
 * Tarefa 9 — engajamento nas notícias: botão de curtir (toggle) e bloco de
 * comentários. O like/comentário é otimista; a lista inicia com os dados do
 * servidor e o componente mantém estado local.
 */
export function NewsEngagement({
  newsId,
  initialLiked,
  initialLikes,
  initialComments,
  canComment,
}: {
  newsId: string;
  initialLiked: boolean;
  initialLikes: number;
  initialComments: CommentItem[];
  canComment: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    startTransition(async () => {
      try {
        const next = !liked;
        // Otimista: atualiza a UI na hora e reverte em caso de erro.
        setLiked(next);
        setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));
        await toggleNewsLike(newsId);
      } catch (error) {
        setLiked((v) => !v);
        setLikesCount((c) => Math.max(0, c + (liked ? -1 : 1)));
        setMessage({
          ok: false,
          text: error instanceof Error ? error.message : 'Não foi possível atualizar.',
        });
      }
    });
  };

  const handleComment = (formData: FormData) => {
    startTransition(async () => {
      try {
        await submitNewsComment(formData);
        const text = String(formData.get('comment') ?? '').trim();
        setComments((prev) => [
          ...prev,
          {
            id: `tmp-${Date.now()}`,
            authorName: 'Você',
            comment: text,
            createdAt: new Date(),
          },
        ]);
        setCommentText('');
        setMessage({ ok: true, text: 'Comentário enviado com sucesso.' });
      } catch (error) {
        setMessage({
          ok: false,
          text: error instanceof Error ? error.message : 'Erro ao enviar comentário.',
        });
      }
    });
  };

  const selectCls =
    'p-3 bg-background border border-border rounded-md focus:border-neon outline-none';

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 mt-4">
      {/* Likes */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={isPending}
          aria-pressed={liked}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all disabled:opacity-50 ${
            liked
              ? 'bg-neon/15 text-neon border border-neon'
              : 'border border-border opacity-80 hover:border-neon hover:text-neon'
          }`}
        >
          <span aria-hidden>♡</span> Curtir ({likesCount})
        </button>
        <span className="text-xs opacity-60">
          {comments.length === 0
            ? 'Seja o primeiro a comentar'
            : `${comments.length} ${comments.length === 1 ? 'comentário' : 'comentários'}`}
        </span>
      </div>

      {/* Comentários existentes */}
      {comments.length > 0 && (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="p-3 bg-background border border-border rounded-lg flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{comment.authorName}</span>
                <span className="text-xs opacity-50">
                  {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-sm opacity-90">{comment.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Novo comentário */}
      {canComment ? (
        <form action={handleComment} className="flex flex-col gap-2">
          <input type="hidden" name="newsId" value={newsId} />
          <textarea
            name="comment"
            rows={2}
            maxLength={600}
            placeholder="Deixe seu comentário..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className={selectCls + ' resize-none'}
          />
          <button
            type="submit"
            disabled={isPending || commentText.trim().length < 2}
            className="self-start px-4 py-2 bg-text text-bg rounded-md font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? 'Enviando...' : 'Comentar'}
          </button>
        </form>
      ) : (
        <p className="text-xs opacity-60">
          Faça{' '}
          <a href="/login" className="text-neon font-bold hover:underline">
            login
          </a>{' '}
          para curtir e comentar.
        </p>
      )}

      {message && (
        <p
          role="status"
          className={`text-xs font-medium ${
            message.ok ? 'text-neon' : 'text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}