import { AuthForm } from '../auth-form';
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode={params.mode === 'update' ? 'update' : 'reset'}/>;
}
