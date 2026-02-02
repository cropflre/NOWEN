/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // 从 CSS 变量引用主题颜色
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent-light)',
        },
        // 背景色
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
        },
        // 文字色
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        // 边框色
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
        },
        // 玻璃效果
        glass: {
          DEFAULT: 'var(--color-glass)',
          border: 'var(--color-glass-border)',
          hover: 'var(--color-glass-hover)',
        },
        // 发光效果
        glow: {
          DEFAULT: 'var(--color-glow)',
          secondary: 'var(--color-glow-secondary)',
        },
        // 旧版星云色保留兼容
        nebula: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          purple: '#667eea',
          pink: '#f093fb',
          orange: '#f5576c',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'aurora': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #667eea 100%)',
        'bg-gradient': 'var(--color-bg-gradient)',
      },
      boxShadow: {
        'theme': 'var(--color-shadow)',
        'theme-hover': 'var(--color-shadow-hover)',
        'glow': '0 0 30px var(--color-glow)',
        'glow-sm': '0 0 15px var(--color-glow)',
        'glow-md': '0 0 30px var(--color-glow)',
        'glow-lg': '0 0 60px var(--color-glow)',
        'glow-cyan': '0 0 40px rgba(0, 242, 254, 0.3)',
        'glow-pink': '0 0 40px rgba(240, 147, 251, 0.3)',
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
        'aurora': 'aurora 20s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'spotlight': 'spotlight 2s ease .75s 1 forwards',
        'meteor': 'meteor 5s linear infinite',
        'border-beam': 'border-beam var(--duration, 12s) linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        aurora: {
          '0%, 100%': { 
            backgroundPosition: '0% 50%',
            backgroundSize: '200% 200%',
          },
          '50%': { 
            backgroundPosition: '100% 50%',
            backgroundSize: '200% 200%',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spotlight: {
          '0%': {
            opacity: 0,
            transform: 'translate(-72%, -62%) scale(0.5)',
          },
          '100%': {
            opacity: 1,
            transform: 'translate(-50%,-40%) scale(1)',
          },
        },
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: 1 },
          '70%': { opacity: 1 },
          '100%': { transform: 'rotate(215deg) translateX(-500px)', opacity: 0 },
        },
        'border-beam': {
          '100%': { offsetDistance: '100%' },
        },
        'border-beam-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px var(--color-glow)' },
          '50%': { boxShadow: '0 0 40px var(--color-glow)' },
        },
      },
    },
  },
  plugins: [],
}
