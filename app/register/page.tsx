import { AuthForm } from '../auth-form';
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="register" defaultRole={params.role === 'provider' ? 'provider' : 'customer'}/>;
}
