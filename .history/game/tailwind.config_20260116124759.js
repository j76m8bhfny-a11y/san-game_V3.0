/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // L1/L2 UI: 现代、清晰、虚伪
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        // L0 背景/底层真相: 复古、粗糙
        pixel: ['"Press Start 2P"', 'monospace'], 
        // L2 档案/机密: 冷漠、机械
        mono: ['"Space Mono"', 'monospace'],
        // L2 古神/觉醒: 疯狂、扭曲
        creepster: ['"Creepster"', 'cursive'],
        // 标题/时尚: 高级
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        // 定义语义化颜色，具体值由 CSS 变量控制
        theme: {
          bg: 'var(--bg-color)',
          text: 'var(--text-color)',
          accent: 'var(--accent-color)',
          panel: 'var(--panel-bg)',
          border: 'var(--border-color)',
        }
      },
      animation: {
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'float': 'float 6s ease-in-out infinite',
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}