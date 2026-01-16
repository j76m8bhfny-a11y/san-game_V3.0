/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 对应 index.css 引入的 Google Fonts
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        pixel: ['"VT323"', '"Press Start 2P"', 'monospace'], // 复古终端字体
        creepster: ['"Creepster"', 'cursive'], // 恐怖/死亡字体
        serif: ['"Playfair Display"', 'serif'],
      },
      animation: {
        // 自定义动画名称: 动画关键帧 持续时间 缓动 次数
        'grain': 'grain 8s steps(10) infinite',
        'bill-entry': 'bill-entry 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'shine': 'shine 1s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -10%)' },
          '20%': { transform: 'translate(-15%, 5%)' },
          '30%': { transform: 'translate(7%, -25%)' },
          '40%': { transform: 'translate(-5%, 25%)' },
          '50%': { transform: 'translate(-15%, 10%)' },
          '60%': { transform: 'translate(15%, 0%)' },
          '70%': { transform: 'translate(0%, 15%)' },
          '80%': { transform: 'translate(3%, 35%)' },
          '90%': { transform: 'translate(-10%, 10%)' },
        },
        'bill-entry': {
          '0%': { transform: 'translateY(-100%) rotate(-5deg)', opacity: '0' },
          '60%': { transform: 'translateY(10%) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'translateY(0) rotate(-1deg)', opacity: '1' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      backgroundImage: {
        // 如果有特定的 CSS 图案可以在这里定义
      }
    },
  },
  plugins: [],
}