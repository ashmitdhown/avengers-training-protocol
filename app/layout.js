import { Inter } from 'next/font/google';
import './globals.css';
import CustomCursor from '@/components/CustomCursor';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Avengers Training Protocol | ATP',
  description: 'The centralized training management system for Avengers recruits and veterans. Log workouts, track nutrition, and achieve peak performance.',
  keywords: 'avengers, training, workout tracker, fitness, nutrition tracker, gym log',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <CustomCursor />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
