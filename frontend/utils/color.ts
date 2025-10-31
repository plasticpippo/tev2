/**
 * A curated list of Tailwind CSS background color classes for the color picker.
 */
export const availableColors = [
    'bg-slate-700',
    'bg-red-800', 'bg-red-500',
    'bg-orange-700', 'bg-orange-500',
    'bg-amber-700', 'bg-amber-500',
    'bg-yellow-700', 'bg-yellow-500',
    'bg-lime-700', 'bg-lime-500',
    'bg-green-800', 'bg-green-600',
    'bg-emerald-800', 'bg-emerald-600',
    'bg-teal-800', 'bg-teal-600',
    'bg-cyan-800', 'bg-cyan-600',
    'bg-sky-800', 'bg-sky-600',
    'bg-blue-800', 'bg-blue-600',
    'bg-indigo-800', 'bg-indigo-600',
    'bg-violet-800', 'bg-violet-600',
    'bg-purple-800', 'bg-purple-600',
    'bg-fuchsia-800', 'bg-fuchsia-600',
    'bg-pink-800', 'bg-pink-600',
    'bg-rose-800', 'bg-rose-600',
];

// A map to get hex values for Tailwind colors to calculate contrast
const tailwindColorHexMap: Record<string, string> = {
    'bg-slate-700': '#334155', 'text-white': '#FFFFFF', 'text-slate-900': '#0f172a',
    'bg-red-800': '#991b1b', 'bg-red-500': '#ef4444',
    'bg-orange-700': '#c2410c', 'bg-orange-500': '#f97316',
    'bg-amber-700': '#b45309', 'bg-amber-500': '#f59e0b',
    'bg-yellow-700': '#a16207', 'bg-yellow-500': '#eab308',
    'bg-lime-700': '#4d7c0f', 'bg-lime-500': '#84cc16',
    'bg-green-800': '#166534', 'bg-green-600': '#16a34a',
    'bg-emerald-800': '#065f46', 'bg-emerald-600': '#059669',
    'bg-teal-800': '#115e59', 'bg-teal-600': '#0d9488',
    'bg-cyan-800': '#155e75', 'bg-cyan-600': '#0891b2',
    'bg-sky-800': '#075985', 'bg-sky-600': '#0284c7',
    'bg-blue-800': '#1e40af', 'bg-blue-600': '#2563eb',
    'bg-indigo-800': '#3730a3', 'bg-indigo-600': '#4f46e5',
    'bg-violet-800': '#5b21b6', 'bg-violet-600': '#7c3aed',
    'bg-purple-800': '#6b21a8', 'bg-purple-600': '#9333ea',
    'bg-fuchsia-800': '#86198f', 'bg-fuchsia-600': '#c026d3',
    'bg-pink-800': '#9d174d', 'bg-pink-600': '#db2777',
    'bg-rose-800': '#9f1239', 'bg-rose-600': '#e11d48',
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