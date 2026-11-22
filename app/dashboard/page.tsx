import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardIndexPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="ds-container ds-section">
        <div className="ds-card ds-setup-card">
          <p className="ds-eyebrow">Workspace setup</p>
          <h1>Supabase configuration required</h1>
          <p className="ds-muted">
            Add your Supabase project URL and anon key to <code>.env.local</code>, then apply the migrations in{' '}
            <code>supabase/migrations</code> to unlock live customer, provider, and compliance workspaces.
          </p>
          <div className="ds-actions-row">
            <Link className="ds-btn ds-btn-primary" href="/browse">
              Explore sample marketplace
            </Link>
            <Link className="ds-btn ds-btn-ghost" href="/">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect('/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [adminCheck, profileResult] = await Promise.all([
    supabase.rpc('is_compliance_admin'),
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ]);

  if (!adminCheck.error && adminCheck.data === true) {
    redirect('/dashboard/compliance');
  }

  if (profileResult.data?.role === 'provider') {
    redirect('/dashboard/provider');
  }

  redirect('/dashboard/customer');
}
