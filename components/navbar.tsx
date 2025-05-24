import { ReactNode } from 'react';
import Link from 'next/link';
import { Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginButton from './login-button';

interface NavbarProps {
  middleContent?: ReactNode;
}

export default function Navbar({ middleContent }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Bus className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-blue-800 font-display">ZerosTour</span>
        </Link>

        {/* 🔹 Aca renderizamos los links si vienen por props */}
        {middleContent && <nav className="hidden md:flex gap-6">{middleContent}</nav>}
        <div className="flex items-center gap-4">
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
