/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色
        brand: {
          blue: '#1e40af',
          green: '#10b981',
          orange: '#f97316',
          cyan: '#06b6d4',
          purple: '#8b5cf6',
        },
        // 外贸行业特色色
        trade: {
          ocean: '#0ea5e9',    // 海洋蓝 - 跨境贸易
          gold: '#f59e0b',     // 金色 - 财富
          coral: '#f97316',    // 珊瑚橙 - 活力
          emerald: '#10b981',  // 翡翠绿 - 珠宝
          sapphire: '#3b82f6', // 蓝宝石 - 专业
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Monaco',
          'Consolas',
          'Courier New',
          'monospace'
        ]
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'sidebar': '2px 0 20px rgba(0, 0, 0, 0.05)',
        'topbar': '0 2px 10px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)',
        'gradient-premium': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      }
    },
  },
  plugins: [],
}