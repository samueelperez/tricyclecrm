import { ReactNode } from 'react';
import SideBar from '@/components/layout/side-bar';

export default function NegociosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SideBar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 