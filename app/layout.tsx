import type { Metadata } from 'next';
import { Newsreader, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';

const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader' });
const instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'VoiceSpec',
  description: 'Convert voice dictation into structured product specs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(newsreader.variable, instrumentSans.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body
        className="antialiased min-h-screen bg-paper text-ink font-instrument"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
