/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        // ... (保留之前的颜色配置 colors.delusion, colors.reality 等)
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Space Mono', 'ui-serif', 'Georgia'],
        mono: ['VT323', 'monospace'], // Pixel Terminal Font
        pixel: ['Press Start 2P', 'cursive'], // Retro Gaming
        creepster: ['Creepster', 'cursive'], // Horror/Madness
        glitch: ['Rubik Glitch', 'cursive'], // Glitch Effect
      },
      animation: {
        'glitch': 'glitch 0.4s cubic-bezier(.25, .46, .45, .94) both infinite',
        'scanline': 'scanline 8s linear infinite',
        // [New] UI v7.0 新增动画
        'shine': 'shine 1s ease-in-out infinite',
        'bill-entry': 'billEntry 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'blink': 'blink 1s step-end infinite',
        'grain': 'grain 8s steps(10) infinite',
      },
      keyframes: {
        // ... (保留 glitch, scanline)
        // [New] 新增 Keyframes
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        billEntry: {
          '0%': { transform: 'translateY(100%) rotate(5deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotate(-1deg)', opacity: '1' }
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        },
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
          '90%': { transform: 'translate(-10%, 10%)' }
        }
      }
    },
  },
  plugins: [],
}