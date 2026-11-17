import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface PageShellProps {
  children?: React.ReactNode;
  tickCount?: number;
}

export const PageShell: React.FC<PageShellProps> = ({ children, tickCount }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F0E6] text-[#2C1810]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <Header tickCount={tickCount} />
        <main className="flex-1 overflow-y-auto p-6 bg-[#F5F0E6]">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
