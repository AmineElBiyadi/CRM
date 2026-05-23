/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm:  '8px',
        md:  '12px',
        lg:  '16px',
        xl:  '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      colors: {
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        card: {
          DEFAULT:    'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT:    'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT:    'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT:    'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT:    'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT:    'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border:  'var(--border)',
        input:   'var(--input)',
        ring:    'var(--ring)',
        alice:   'var(--alice)',
        honeydew:'var(--honeydew)',
        vanilla: 'var(--vanilla)',
        eerie:   'var(--eerie)',
        ghost:   'var(--ghost)',
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
        sidebar: {
          DEFAULT:             'var(--sidebar)',
          foreground:          'var(--sidebar-foreground)',
          primary:             'var(--sidebar-primary)',
          'primary-foreground':'var(--sidebar-primary-foreground)',
          accent:              'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border:              'var(--sidebar-border)',
          ring:                'var(--sidebar-ring)',
        },
      },
      boxShadow: {
        neu:        'var(--shadow-neu)',
        'neu-sm':   'var(--shadow-neu-sm)',
        'neu-lg':   'var(--shadow-neu-lg)',
        'neu-inset':'var(--shadow-neu-inset)',
        glass:      'var(--shadow-glass)',
      },
    },
  },
  plugins: [],
}
