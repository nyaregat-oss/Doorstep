import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeInternalPath } from '@/lib/auth-validation';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const safeNext = safeInternalPath(request.nextUrl.searchParams.get('next'), request.nextUrl.origin);
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  }
  return NextResponse.redirect(new URL('/login?verified=0', request.url));
}
