import type { Metadata } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import './globals.css';
import { ThemeProvider } from './theme-provider';
import { PrelaunchBanner } from './prelaunch-banner';
import { isLaunchGateEnabled } from '@/lib/launch-gate';
import { MotionProvider } from '@/components/motion';
import { ToastProvider } from '@/components/ui/toast';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  title: 'Doorstep — Trusted Local Service Professionals Across Kenya',
  description:
    'Find trusted professionals. Get things done. Right at your doorstep. Browse skilled plumbers, electricians, cleaners, carpenters, and specialists across Kenya.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <MotionProvider>
            <ToastProvider>
              {isLaunchGateEnabled() && <PrelaunchBanner />}
              <SiteHeader />
              {children}
              <SiteFooter />
            </ToastProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
