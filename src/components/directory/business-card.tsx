'use client';

import Image from 'next/image';
import Link from 'next/link';

type BusinessCardProps = {
  name: string;
  specialty: string;
  location: string;
  avatarUrl?: string | null;
  contactUrl: string;
};

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function BusinessCard({
  name,
  specialty,
  location,
  avatarUrl,
  contactUrl,
}: BusinessCardProps) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border border-border bg-surface p-6 transition-colors hover:border-neon">
      {avatarUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-border/40">
          <Image src={avatarUrl} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center rounded-lg border border-border bg-accent/20">
          <span className="font-playfair text-4xl font-bold opacity-40">{initials(name)}</span>
        </div>
      )}
      <div className="flex-1">
        <h2 className="font-playfair text-xl font-bold">{name}</h2>
        <p className="mt-1 text-sm font-semibold text-neon">{specialty}</p>
        <p className="mt-2 text-sm opacity-70">{location}</p>
      </div>
      <Link href={contactUrl} className="inline-flex justify-center rounded-md border border-neon py-3 font-bold text-neon transition-colors hover:bg-neon hover:text-black">
        Ver detalhes e contato
      </Link>
    </article>
  );
}
