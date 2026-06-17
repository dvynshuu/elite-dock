import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/styles/globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'Elite Dock',
  description: 'A recall-first bookmark workspace that helps saved knowledge get reused'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('bookmark-theme') || 'light';
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.setAttribute('data-bs-theme', theme);
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
