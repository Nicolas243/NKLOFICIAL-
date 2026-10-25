'use client';

import Link from 'next/link';

type WalletEnrollment = { id: string; teacherId: string; teacherName: string; totalCredits: number; usedCredits: number; expiresAt: string; status: string };

export function StudentPlansWallet({ enrollments }: { enrollments: WalletEnrollment[] }) {
  return <section className="mb-8"><h2 className="mb-4 font-playfair text-2xl font-bold">Minha carteira de aulas</h2>{enrollments.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-sm opacity-70">Seus planos recorrentes aparecerão aqui após a aprovação do pagamento.</p> : <div className="grid gap-4 md:grid-cols-2">{enrollments.map((item) => { const remaining = item.totalCredits - item.usedCredits; return <article key={item.id} className="rounded-xl border border-border bg-surface p-5"><strong>{item.teacherName}</strong><p className="mt-2 text-sm">{remaining} de {item.totalCredits} aulas restantes</p><progress className="mt-3 w-full" value={item.usedCredits} max={item.totalCredits} /><p className="mt-2 text-xs opacity-60">Válido até {new Date(item.expiresAt).toLocaleDateString('pt-BR')}</p><Link href={`/professores/${item.teacherId}`} className="mt-4 inline-block text-sm font-bold text-neon hover:underline">Agendar próxima aula deste plano</Link></article>; })}</div>}</section>;
}
