import type { ThemeColor } from '@shared/types';

export const themeColors: ThemeColor[] = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose', 'warmGray', 'coolGray'
];

export const themeColorOptions: { value: ThemeColor; label: string; bgClass: string }[] = [
  { value: 'slate', label: 'Slate', bgClass: 'bg-slate-600' },
  { value: 'gray', label: 'Gray', bgClass: 'bg-gray-600' },
  { value: 'zinc', label: 'Zinc', bgClass: 'bg-zinc-600' },
  { value: 'neutral', label: 'Neutral', bgClass: 'bg-neutral-600' },
  { value: 'stone', label: 'Stone', bgClass: 'bg-stone-600' },
  { value: 'red', label: 'Red', bgClass: 'bg-red-600' },
  { value: 'orange', label: 'Orange', bgClass: 'bg-orange-600' },
  { value: 'amber', label: 'Amber', bgClass: 'bg-amber-600' },
  { value: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-500' },
  { value: 'lime', label: 'Lime', bgClass: 'bg-lime-600' },
  { value: 'green', label: 'Green', bgClass: 'bg-green-600' },
  { value: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-600' },
  { value: 'teal', label: 'Teal', bgClass: 'bg-teal-600' },
  { value: 'cyan', label: 'Cyan', bgClass: 'bg-cyan-600' },
  { value: 'sky', label: 'Sky', bgClass: 'bg-sky-600' },
  { value: 'blue', label: 'Blue', bgClass: 'bg-blue-600' },
  { value: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-600' },
  { value: 'violet', label: 'Violet', bgClass: 'bg-violet-600' },
  { value: 'purple', label: 'Purple', bgClass: 'bg-purple-600' },
  { value: 'fuchsia', label: 'Fuchsia', bgClass: 'bg-fuchsia-600' },
  { value: 'pink', label: 'Pink', bgClass: 'bg-pink-600' },
  { value: 'rose', label: 'Rose', bgClass: 'bg-rose-600' },
  { value: 'warmGray', label: 'Warm Gray', bgClass: 'bg-warmGray-600' },
  { value: 'coolGray', label: 'Cool Gray', bgClass: 'bg-coolGray-600' },
];

export function getDefaultThemeColor(): ThemeColor {
  return 'slate';
}
