/** @type {import('tailwindcss').Config} */
module.exports = {
   content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      transitionDuration: {
        '400': '400ms',
      },
      colors: {
        gold: {
          50:  '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A',
          300: '#FCD34D', 400: '#FBBF24', 500: '#C9941A',
          600: '#A87C16', 700: '#8A6310', 800: '#6B4D0C', 900: '#4A3508',
        },
        onyx: {
          50:'#F8F8F8', 100:'#EEEEEE', 200:'#D4D4D4', 300:'#B0B0B0',
          400:'#828282', 500:'#5A5A5A', 600:'#3D3D3D', 700:'#282828',
          800:'#1A1A1A', 900:'#111111', 950:'#080808',
        },
        // Shadcn/ui bridge — these all resolve to plain CSS custom properties
        // (not the hsl(var(--x)) convention shadcn defaults to), because our
        // existing tokens in globals.css are already real color values, not
        // HSL triples. See the "shadcn bridge" block in globals.css :root /
        // [data-theme="dark"] — every name below aliases an existing brand
        // token so shadcn components inherit our teal/green system for free.
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:    ['var(--font-inter)',     'system-ui', 'sans-serif'],
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'slide-up':   'slideUp 0.6s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':    'fadeIn 0.4s ease',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow':  'spin 8s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
      keyframes: {
        float:     { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-10px)' } },
        shimmer:   { '0%': { backgroundPosition:'-200% 0' }, '100%': { backgroundPosition:'200% 0' } },
        slideUp:   { from:{ opacity:0, transform:'translateY(20px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        fadeIn:    { from:{ opacity:0 }, to:{ opacity:1 } },
        scaleIn:   { from:{ opacity:0, transform:'scale(0.92)' }, to:{ opacity:1, transform:'scale(1)' } },
        pulseGold: { '0%,100%':{ boxShadow:'0 0 0 0 rgba(201,148,26,0.3)' }, '50%':{ boxShadow:'0 0 0 10px rgba(201,148,26,0)' } },
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}