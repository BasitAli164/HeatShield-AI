import './globals.css';
import { Inter } from 'next/font/google';
import { validateConfig } from '@/lib/fortyguard/config';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'HeatShield AI - Hyperlocal Heat Intelligence',
  description: 'AI-powered urban heat-risk intelligence platform',
};

export default function RootLayout({ children }) {
  // Log configuration status (server-side only)
  if (typeof window === 'undefined') {
    const isConfigured = validateConfig();
    if (!isConfigured) {
      console.warn('⚠️ FortyGuard API not configured. Please set FORTYGUARD_API_KEY in .env.local');
    }
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}