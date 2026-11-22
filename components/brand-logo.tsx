import Link from 'next/link';

export function BrandLogo({
  href = '/',
  variant = 'default',
  label = 'Doorstep',
}: {
  href?: string;
  variant?: 'default' | 'dark';
  label?: string;
}) {
  return (
    <Link className={`ds-logo ${variant === 'dark' ? 'ds-logo-dark' : ''}`} href={href}>
      <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#101D2B" />
        <path
          d="M14 31L32 15L50 31V49C50 50.1046 49.1046 51 48 51H16C14.8954 51 14 50.1046 14 49V31Z"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M26 51V35C26 33.8954 26.8954 33 28 33H36C37.1046 33 38 33.8954 38 35V51"
          fill="#E9A65A"
        />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
