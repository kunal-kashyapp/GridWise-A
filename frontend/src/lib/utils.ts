import { type ClassValue, clsx } from 'clsx';
  import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPower(kw: number | undefined | null): string {
  if (kw == null || isNaN(kw)) return '0.0 kW';
  return `${kw.toFixed(1)} kW`;
}

export function formatTemp(celsius: number | undefined | null): string {
  if (celsius == null || isNaN(celsius)) return '-- °C';
  return `${celsius.toFixed(1)}°C`;
}

export function formatHumidity(rh: number | undefined | null): string {
  if (rh == null || isNaN(rh)) return '-- %';
  return `${rh.toFixed(0)}%`;
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatNumber(val: number | undefined | null, decimals = 1): string {
  if (val == null || isNaN(val)) return '0';
  return val.toFixed(decimals);
}

export function getHvacBadgeVariant(status: string | undefined): 'forest' | 'amber' | 'walnut' | 'outline' | 'neutral' {
  const s = (status || '').toLowerCase();
  if (s === 'cooling' || s === 'cool') return 'forest';
  if (s === 'heating' || s === 'heat') return 'amber';
  if (s === 'idle' || s === 'fan') return 'walnut';
  if (s === 'off') return 'neutral';
  return 'outline';
}
