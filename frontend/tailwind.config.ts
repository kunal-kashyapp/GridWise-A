import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F0E6',
        card: {
          DEFAULT: '#FFFBF4',
          alt: '#EDE8DC',
        },
        'border-warm': '#D4C9B5',
        espresso: {
          DEFAULT: '#2C1810',
          muted: '#6B5B4E',
        },
        forest: {
          DEFAULT: '#2D6A2E',
          light: '#E8F5E3',
          dark: '#1E4D1F',
          hover: '#245525',
        },
        walnut: {
          DEFAULT: '#7A5C2E',
          light: '#F0E6D3',
          hover: '#634A24',
        },
        alert: {
          red: '#B8372D',
          amber: '#D4920A',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        warm: '0 1px 3px 0 rgba(44, 24, 16, 0.05), 0 1px 2px -1px rgba(44, 24, 16, 0.05)',
        'warm-md': '0 4px 6px -1px rgba(44, 24, 16, 0.07), 0 2px 4px -2px rgba(44, 24, 16, 0.05)',
        'warm-lg': '0 10px 15px -3px rgba(44, 24, 16, 0.08), 0 4px 6px -4px rgba(44, 24, 16, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
