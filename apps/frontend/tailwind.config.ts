import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Light theme
        card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        lift: '0 4px 16px -4px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
        // Dark theme — teal glow (uses --ring CSS var which maps to primary)
        'glow-sm': '0 0 12px -3px hsl(var(--ring) / 0.45)',
        'glow':    '0 0 22px -5px hsl(var(--ring) / 0.4)',
        'glow-lg': '0 0 40px -8px hsl(var(--ring) / 0.35)',
        'glass':   'inset 0 1px 0 0 rgb(255 255 255 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.3)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(200%)' } },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%':       { opacity: '0.7', transform: 'scale(1.02)' },
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      animation: {
        shimmer:      'shimmer 1.6s infinite',
        'pulse-glow': 'pulse-glow 2.8s ease-in-out infinite',
        'scan-line':  'scan-line 5s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
