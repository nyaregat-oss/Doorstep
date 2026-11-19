import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './theme-provider';
import { PrelaunchBanner } from './prelaunch-banner';
import { isLaunchGateEnabled } from '@/lib/launch-gate';

export const metadata: Metadata = {
  title: 'Doorstep – Every service. One connection.',
  description: 'Find local service providers across Kenya, compare starting prices, and send booking or quotation requests through Doorstep.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Figtree:wght@400;500;600&display=swap" rel="stylesheet"/></head><body><ThemeProvider>{isLaunchGateEnabled() && <PrelaunchBanner/>}{children}<footer className="site-footer"><a href="/terms">Marketplace information</a><a href="/privacy">Privacy information</a><a href="/report">Report a concern</a></footer></ThemeProvider></body></html>;
}
