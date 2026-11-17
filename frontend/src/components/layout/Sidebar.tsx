import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Cpu,
  Settings,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZONES } from '@/lib/constants';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Overview / Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { name: 'Zone Deep Dive', href: '/zones', icon: Building2 },
  { name: 'Demand Forecasts', href: '/forecasts', icon: TrendingUp },
  { name: 'AI Agent Console', href: '/agent', icon: Cpu },
  { name: 'System Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen bg-[#FFFBF4] border-r border-[#D4C9B5] flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-[#D4C9B5]/80 bg-[#FFFBF4]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8F5E3] border border-[#2D6A2E]/30 flex items-center justify-center text-[#2D6A2E] shadow-xs">
              <Zap className="w-5 h-5 fill-[#2D6A2E]/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-[#2C1810] tracking-tight">GridWise</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#EDE8DC] text-[#7A5C2E] border border-[#D4C9B5]/60">
                  Edge
                </span>
              </div>
              <p className="text-xs text-[#6B5B4E] font-medium">Edge BEMS Console</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150',
                  isActive
                    ? 'bg-[#E8F5E3] text-[#1E4D1F] font-semibold shadow-xs border-l-3 border-[#2D6A2E]'
                    : 'text-[#6B5B4E] hover:bg-[#EDE8DC] hover:text-[#2C1810] font-medium'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-[#2D6A2E]' : 'text-[#7A5C2E]'
                  )}
                />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Quick Zone Status Pill List */}
      <div className="p-4 border-t border-[#D4C9B5]/80 bg-[#FFFBF4]/60">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A5C2E]">
            Building Zones
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-[#2D6A2E] animate-pulse" title="Telemetry Active" />
        </div>

        <div className="space-y-1.5">
          {ZONES.map((zone) => {
            const isZoneActive = location.pathname === `/zones/${zone.id}`;
            return (
              <NavLink
                key={zone.id}
                to={`/zones/${zone.id}`}
                className={cn(
                  'flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors border',
                  isZoneActive
                    ? 'bg-[#E8F5E3] border-[#2D6A2E]/40 text-[#1E4D1F] font-semibold'
                    : 'bg-[#EDE8DC]/50 border-transparent hover:border-[#D4C9B5] text-[#2C1810] hover:bg-[#EDE8DC]'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A2E] shrink-0" />
                  <span className="truncate">{zone.name}</span>
                </div>
                <span className="text-[10px] text-[#6B5B4E] font-mono shrink-0">
                  {zone.basePower}kW
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
