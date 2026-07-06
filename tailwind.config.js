/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1a4480',
          light: '#3b82f6',
          dark: '#0f2d5e',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"DIN Alternate"', '"SF Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
