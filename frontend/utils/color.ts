/**
 * A curated list of Tailwind CSS background color classes for the color picker.
 */
export const availableColors = [
    'bg-slate-700',
    'bg-gray-700', 'bg-gray-500',
    'bg-red-800', 'bg-red-600', 'bg-red-500', 'bg-red-400',
    'bg-orange-800', 'bg-orange-600', 'bg-orange-500', 'bg-orange-400',
    'bg-amber-800', 'bg-amber-600', 'bg-amber-500', 'bg-amber-400',
    'bg-yellow-700', 'bg-yellow-500', 'bg-yellow-400', 'bg-yellow-300',
    'bg-lime-700', 'bg-lime-500', 'bg-lime-400', 'bg-lime-300',
    'bg-green-800', 'bg-green-600', 'bg-green-500', 'bg-green-400',
    'bg-emerald-800', 'bg-emerald-600', 'bg-emerald-500', 'bg-emerald-400',
    'bg-teal-800', 'bg-teal-600', 'bg-teal-500', 'bg-teal-400',
    'bg-cyan-800', 'bg-cyan-600', 'bg-cyan-500', 'bg-cyan-400',
    'bg-sky-800', 'bg-sky-600', 'bg-sky-500', 'bg-sky-400',
    'bg-blue-800', 'bg-blue-600', 'bg-blue-500', 'bg-blue-400',
    'bg-indigo-800', 'bg-indigo-600', 'bg-indigo-500', 'bg-indigo-400',
    'bg-violet-800', 'bg-violet-600', 'bg-violet-500', 'bg-violet-400',
    'bg-purple-800', 'bg-purple-600', 'bg-purple-500', 'bg-purple-400',
    'bg-fuchsia-800', 'bg-fuchsia-600', 'bg-fuchsia-500', 'bg-fuchsia-400',
    'bg-pink-800', 'bg-pink-600', 'bg-pink-500', 'bg-pink-400',
    'bg-rose-800', 'bg-rose-600', 'bg-rose-500', 'bg-rose-400',
];

// A map to get hex values for Tailwind colors to calculate contrast
const tailwindColorHexMap: Record<string, string> = {
    'bg-slate-700': '#334155', 'text-white': '#FFFFFF', 'text-slate-900': '#0f172a',
    'bg-gray-700': '#374151', 'bg-gray-500': '#6b7280',
    'bg-red-800': '#991b1b', 'bg-red-600': '#dc2626', 'bg-red-500': '#ef4444', 'bg-red-400': '#f87171',
    'bg-orange-800': '#9c4668', 'bg-orange-600': '#ea580c', 'bg-orange-500': '#f97316', 'bg-orange-400': '#fb923c',
    'bg-amber-800': '#92400e', 'bg-amber-600': '#d97706', 'bg-amber-500': '#f59e0b', 'bg-amber-400': '#fbbf24',
    'bg-yellow-700': '#a16207', 'bg-yellow-500': '#eab308', 'bg-yellow-400': '#facc15', 'bg-yellow-300': '#fde047',
    'bg-lime-700': '#4d7c0f', 'bg-lime-500': '#84cc16', 'bg-lime-400': '#a3e635', 'bg-lime-300': '#bef264',
    'bg-green-800': '#166534', 'bg-green-600': '#16a34a', 'bg-green-500': '#22c55e', 'bg-green-400': '#4ade80',
    'bg-emerald-800': '#065f46', 'bg-emerald-600': '#059669', 'bg-emerald-500': '#10b981', 'bg-emerald-400': '#34d399',
    'bg-teal-800': '#115e59', 'bg-teal-600': '#0d9488', 'bg-teal-500': '#14b8a6', 'bg-teal-400': '#2dd4bf',
    'bg-cyan-800': '#155e75', 'bg-cyan-600': '#0891b2', 'bg-cyan-500': '#06b6d4', 'bg-cyan-400': '#22d3ee',
    'bg-sky-800': '#075985', 'bg-sky-600': '#0284c7', 'bg-sky-500': '#0ea5e9', 'bg-sky-400': '#38bdf8',
    'bg-blue-800': '#1e40af', 'bg-blue-600': '#2563eb', 'bg-blue-500': '#3b82f6', 'bg-blue-400': '#60a5fa',
    'bg-indigo-800': '#3730a3', 'bg-indigo-600': '#4f46e5', 'bg-indigo-500': '#6366f1', 'bg-indigo-400': '#818cf8',
    'bg-violet-800': '#5b21b6', 'bg-violet-600': '#7c3aed', 'bg-violet-500': '#8b5cf6', 'bg-violet-400': '#a78bfa',
    'bg-purple-800': '#6b21a8', 'bg-purple-600': '#9333ea', 'bg-purple-500': '#a855f7', 'bg-purple-400': '#c084fc',
    'bg-fuchsia-800': '#86198f', 'bg-fuchsia-600': '#c026d3', 'bg-fuchsia-500': '#d946ef', 'bg-fuchsia-400': '#e879f9',
    'bg-pink-800': '#9d174d', 'bg-pink-600': '#db2777', 'bg-pink-500': '#ec4899', 'bg-pink-400': '#f472b6',
    'bg-rose-800': '#9f1239', 'bg-rose-600': '#e11d48', 'bg-rose-500': '#f43f5e', 'bg-rose-400': '#fb7185',
};

/**
 * Calculates the luminance of a color.
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @returns Luminance value
 */
function getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Converts a hex color string to an RGB object.
 * @param hex Hex color string (e.g., "#RRGGBB")
 * @returns Object with r, g, b properties
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null;
}

/**
 * Given a Tailwind background color class, determines whether white or black text
 * provides better contrast.
 * @param bgColorClass Tailwind background color class (e.g., 'bg-blue-800')
 * @returns Tailwind text color class ('text-white' or 'text-slate-900')
 */
export function getContrastingTextColor(bgColorClass: string): 'text-white' | 'text-slate-900' {
    const hex = tailwindColorHexMap[bgColorClass];
    if (!hex) return 'text-white'; // Default for unknown colors

    const rgb = hexToRgb(hex);
    if (!rgb) return 'text-white';

    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    
    // The threshold value can be adjusted, but 0.5 is a common choice.
    // If the background is dark (luminance < 0.5), use light text.
    // If the background is light (luminance >= 0.5), use dark text.
    return luminance < 0.5 ? 'text-white' : 'text-slate-900';
}