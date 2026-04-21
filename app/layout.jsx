import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'E.C.H.O - Emotion-Centric Human Optimizer',
  description: 'AI-powered productivity system that adapts tasks based on emotions',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={inter.className + ' overflow-x-hidden'}>{children}</body>
    </html>
  );
}
