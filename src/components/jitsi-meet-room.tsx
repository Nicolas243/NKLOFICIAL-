'use client';

import { useState } from 'react';

type JitsiMeetRoomProps = {
  /** Nome único e determinístico da sala por professor. */
  roomName: string;
  displayName: string;
};

/**
 * Tarefa 13 — aula de vídeo embarcada via Jitsi Meet (sem API key, hospedagem
 * pública do meet.jit.si). O aluno entra na sala do professor; a sessão de
 * aula é P2P/SFU do próprio Jitsi. Para produção escalável, trocar a URL
 * base por uma instância self-hosted ou 8x8.vc via env.
 */
export function JitsiMeetRoom({ roomName, displayName }: JitsiMeetRoomProps) {
  const [started, setStarted] = useState(false);
  const jitsiUrl = `https://meet.jit.si/nkl-aula-${roomName}`;

  if (!started) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
        >
          Iniciar aula de vídeo
        </button>
        <p className="text-xs opacity-60 text-center">
          Será solicitada permissão de câmera e microfone ao entrar na sala.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <iframe
        title={`Aula de vídeo com ${displayName}`}
        src={`${jitsiUrl}#userInfo.displayName=${encodeURIComponent(displayName)}`}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="w-full aspect-video rounded-xl border border-border bg-black"
      />
      <a
        href={jitsiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-neon font-bold hover:underline text-center"
      >
        Problemas com o vídeo? Abrir a sala em nova aba
      </a>
    </div>
  );
}
