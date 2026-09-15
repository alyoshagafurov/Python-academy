import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The type scale in index.css (@theme --text-*) uses names tailwind-merge does not
// know; without this, `text-body` is read as a colour and silently drops
// `text-fg` / `text-accent-fg` (or the size) when classes are merged.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["caption", "body", "title3", "title2", "title1", "display"] }],
    },
  },
});

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 1234 → "1 234"; 12345 → "12 345" (thin spaces, ru style). */
export function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU").replace(/,/g, " ");
}

export function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
