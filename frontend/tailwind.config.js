/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-slate-600',
    'bg-gray-600',
    'bg-zinc-600',
    'bg-neutral-600',
    'bg-stone-600',
    'bg-red-600',
    'bg-orange-600',
    'bg-amber-600',
    'bg-yellow-500',
    'bg-lime-600',
    'bg-green-600',
    'bg-emerald-600',
    'bg-teal-600',
    'bg-cyan-600',
    'bg-sky-600',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-purple-600',
    'bg-fuchsia-600',
    'bg-pink-600',
    'bg-rose-600',
  ],
  theme: {
    extend: {
      containers: {
        xs: '320px',
        sm: '384px',
        md: '448px',
        lg: '512px',
        xl: '576px',
        '2xl': '672px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}