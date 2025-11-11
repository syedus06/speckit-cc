import SideNav from '@/components/SideNav';
import Header from '@/components/Header';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'SpecKit Control Center',
  description: 'Orchestrate and manage the entire Spec Kit and Specify CLI workflow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} flex`}>
        <SideNav />
        <main className="flex-1">
          <Header />
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
