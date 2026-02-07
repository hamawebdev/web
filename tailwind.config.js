/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
    './src/components/ui/**/*.{ts,tsx,js,jsx}',
    './src/lib/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
      // Custom breakpoints for our design system
      'mobile': {'max': '767px'},
      'tablet': {'min': '768px', 'max': '1279px'},
      'desktop': {'min': '1280px'},
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'ui-sans-serif', 'sans-serif', 'system-ui'],
        serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Consolas', '"Liberation Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
        xl: `calc(var(--radius) + 4px)`,
      },
      boxShadow: {
        '2xs': 'var(--shadow-2xs)',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      letterSpacing: {
        tighter: 'var(--tracking-tighter)',
        tight: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
        wider: 'var(--tracking-wider)',
        widest: 'var(--tracking-widest)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'spin-slow': 'spin-slow 20s linear infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite ease-in-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
        },
        '.touch-target-large': {
          minHeight: '48px',
          minWidth: '48px',
        },
        '.responsive-grid-1-2-3': {
          display: 'grid',
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          gap: '1rem',
          '@media (min-width: 768px) and (max-width: 1279px)': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '1.5rem',
          },
          '@media (min-width: 1280px)': {
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '2rem',
          },
        },
        '.responsive-grid-1-2-4': {
          display: 'grid',
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          gap: '1rem',
          '@media (min-width: 768px) and (max-width: 1279px)': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '1.5rem',
          },
          '@media (min-width: 1280px)': {
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '2rem',
          },
        },
        '.responsive-container': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          '@media (min-width: 768px) and (max-width: 1279px)': {
            paddingLeft: '2rem',
            paddingRight: '2rem',
          },
          '@media (min-width: 1280px)': {
            maxWidth: '1280px',
            paddingLeft: '3rem',
            paddingRight: '3rem',
          },
          '@media (min-width: 1440px)': {
            maxWidth: '1440px',
            paddingLeft: '4rem',
            paddingRight: '4rem',
          },
        },
        '.loading-skeleton': {
          backgroundColor: theme('colors.muted.DEFAULT'),
          borderRadius: theme('borderRadius.DEFAULT'),
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '.loading-skeleton-text': {
          height: '1rem',
          width: '100%',
          backgroundColor: theme('colors.muted.DEFAULT'),
          borderRadius: theme('borderRadius.DEFAULT'),
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '.loading-skeleton-title': {
          height: '1.5rem',
          width: '75%',
          backgroundColor: theme('colors.muted.DEFAULT'),
          borderRadius: theme('borderRadius.DEFAULT'),
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '.loading-skeleton-button': {
          height: '2.5rem',
          width: '6rem',
          backgroundColor: theme('colors.muted.DEFAULT'),
          borderRadius: theme('borderRadius.DEFAULT'),
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '.loading-skeleton-avatar': {
          height: '2.5rem',
          width: '2.5rem',
          backgroundColor: theme('colors.muted.DEFAULT'),
          borderRadius: '50%',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '.loading-skeleton-card': {
          height: '8rem',
          width: '100%',
          backgroundColor: theme('colors.muted.DEFAULT'),
          borderRadius: theme('borderRadius.lg'),
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}