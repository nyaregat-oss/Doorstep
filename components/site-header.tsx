import { createClient } from '@/lib/supabase/server';
import { SiteHeaderClient, type HeaderSession } from './site-header-client';

export async function SiteHeader() {
  const session: HeaderSession = {
    signedIn: false,
    dashboardHref: '/login',
    unreadNotifications: 0,
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        session.signedIn = true;
        const [adminResult, profileResult, unreadResult] = await Promise.all([
          supabase.rpc('is_compliance_admin'),
          supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle(),
          supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .is('read_at', null),
        ]);

        if (!adminResult.error && adminResult.data === true) {
          session.dashboardHref = '/dashboard/compliance';
        } else if (profileResult.data?.role === 'provider') {
          session.dashboardHref = '/dashboard/provider';
        } else {
          session.dashboardHref = '/dashboard/customer';
        }
        session.unreadNotifications = unreadResult.count || 0;
        session.label = profileResult.data?.full_name || undefined;
      }
    } catch {
      // Keep public navigation intact if Supabase is unreachable or unconfigured.
    }
  }

  return <SiteHeaderClient session={session} />;
}
