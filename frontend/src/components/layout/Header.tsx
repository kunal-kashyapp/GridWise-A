import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Cpu, Clock, Activity } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { ZONE_BY_ID } from '@/lib/constants';

interface HeaderProps {
  tickCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ tickCount }) => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [internalTicks, setInternalTicks] = useState<number>(1);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulator tick counter pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setInternalTicks((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const displayTick = tickCount !== undefined ? tickCount : internalTicks;

  // Determine breadcrumb and page title from route
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') {
      return { title: 'Overview & Campus Grid', crumbs: [{ label: 'Console' }, { label: 'Overview' }] };
    }
    if (path.startsWith('/zones')) {
      const parts = path.split('/').filter(Boolean);
      const zoneId = parts[1];
      const zoneMeta = zoneId ? ZONE_BY_ID[zoneId] : null;
      return {
        title: zoneMeta ? `${zoneMeta.name} Telemetry` : 'Zone Deep Dive',
        crumbs: [
          { label: 'Console', href: '/' },
          { label: 'Zones', href: '/zones' },
          ...(zoneMeta ? [{ label: zoneMeta.name }] : []),
        ],
      };
    }
    if (path === '/forecasts') {
      return { title: 'Demand & Load Forecasts', crumbs: [{ label: 'Console', href: '/' }, { label: 'Forecasts' }] };
    }
    if (path === '/agent') {
      return { title: 'Autonomous AI Agent Console', crumbs: [{ label: 'Console', href: '/' }, { label: 'Agent Console' }] };
    }
    if (path === '/settings') {
      return { title: 'System & Simulation Settings', crumbs: [{ label: 'Console', href: '/' }, { label: 'Settings' }] };
    }
    return { title: 'BEMS Console', crumbs: [{ label: 'Console' }] };
  };

  const { title, crumbs } = getBreadcrumbs();

  return (
    <header className="h-16 bg-[#FFFBF4] border-b border-[#D4C9B5] px-6 flex items-center justify-between shrink-0">
      {/* Left: Breadcrumbs & Title */}
      <div className="flex flex-col justify-center">
        <nav className="flex items-center gap-1.5 text-xs text-[#6B5B4E]">
          {crumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#D4C9B5]" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-[#2C1810] transition-colors font-medium hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-[#2C1810]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
        <h1 className="text-base font-bold text-[#2C1810] tracking-tight leading-tight">
          {title}
        </h1>
      </div>

      {/* Right: Status Indicators */}
      <div className="flex items-center gap-3">
        {/* Simulation Tick Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#EDE8DC] border border-[#D4C9B5] text-xs text-[#6B5B4E]">
          <Activity className="w-3.5 h-3.5 text-[#7A5C2E]" />
          <span className="font-medium">Tick</span>
          <span className="font-mono font-bold text-[#2C1810] tabular-nums">
            #{displayTick}
          </span>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EDE8DC] border border-[#D4C9B5] text-xs text-[#2C1810] font-mono">
          <Clock className="w-3.5 h-3.5 text-[#7A5C2E]" />
          <span className="tabular-nums">{currentTime || '--:--:--'}</span>
        </div>

        {/* Edge Agent Status Badge */}
        <Badge variant="forest" size="md" dot className="shadow-xs cursor-default">
          <Cpu className="w-3.5 h-3.5 text-[#2D6A2E] mr-0.5 inline" />
          <span>Edge Agent Active - Local Ollama</span>
        </Badge>
      </div>
    </header>
  );
};
