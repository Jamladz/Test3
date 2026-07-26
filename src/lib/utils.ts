import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (!num || num === 0) return '0';
  if (Math.abs(num) >= 1000000000) {
    const val = num / 1000000000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)) + 'B';
  }
  if (Math.abs(num) >= 1000000) {
    const val = num / 1000000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    const val = num / 1000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'K';
  }
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCurrency(num: number): string {
  return formatNumber(num);
}

export function plushPToPlush(plushP: number): number {
  return (plushP || 0) / 10000;
}

export function formatPlushP(plushP: number): string {
  return `${formatNumber(plushP)} PlushP`;
}

export function formatPlushToken(plushP: number): string {
  const plushVal = plushPToPlush(plushP);
  return `${formatNumber(plushVal)} $PLUSH`;
}
