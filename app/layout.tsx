import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './theme-provider';

export const metadata: Metadata = {
  title: 'Doorstep – Find the right professional',
  description: 'Discover trusted professionals, compare services, and connect with the right people to get your work done.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Figtree:wght@400;500;600&display=swap" rel="stylesheet"/></head><body><ThemeProvider>{children}</ThemeProvider></body></html>;
}
