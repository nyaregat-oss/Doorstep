import { AuthForm } from '../auth-form';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ checkEmail?: string; verified?: string; signout?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="login" checkEmail={params.checkEmail === '1'} verificationFailed={params.verified === '0'} signOutFailed={params.signout === '0'}/>;
}
