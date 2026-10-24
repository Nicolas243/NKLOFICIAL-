import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { AvailabilityManager } from '@/components/dashboard/availability-manager';
import { db } from '@/db';
import { users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Dashboard do Professor | Portal NKL',
};

export default async function ProfessorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [profile] = await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile || profile.role !== 'professor') {
    redirect('/');
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Teacher Hub</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold sm:text-5xl">Sua agenda, no seu ritmo</h1>
        <p className="mt-4 text-base opacity-70">
          Olá, {profile.name}. Defina os intervalos em que você pode receber alunos.
        </p>
      </div>
      <AvailabilityManager />
    </div>
  );
}
