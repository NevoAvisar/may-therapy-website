import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names and resolves Tailwind conflicts | מחבר מחלקות CSS ופותר התנגשויות של Tailwind */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
