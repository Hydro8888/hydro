import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        foreground: '#f5f5f5',
        card: '#1a1a2e',
        'card-foreground': '#f5f5f5',
        sidebar: '#16213e',
        primary: {
          DEFAULT: '#e91e8c',
          light: '#ff6b9d',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#c9a96e',
          bright: '#ffd700',
          foreground: '#0f0f0f',
        },
        muted: {
          DEFAULT: '#2a2a3e',
          foreground: '#a0a0a0',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#4ade80',
          foreground: '#0f0f0f',
        },
        border: '#2a2a3e',
        input: '#2a2a3e',
        ring: '#e91e8c',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
