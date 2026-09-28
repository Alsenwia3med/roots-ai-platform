import './globals.css';
import { SystemOverlays } from '../components/system/SystemOverlays';

export const metadata = {
  title: 'ROOTS-AI™ - Biological Intelligence',
  description: 'Golden Screen Acceptance Brief v1.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#040D1A] text-white">
      <body className="min-h-screen bg-[#040D1A] antialiased">
        {children}
        <SystemOverlays />
      </body>
    </html>
  );
}
