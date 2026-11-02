const colors = require('./src/theme/colors.json')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // app.json에서 라이트 모드로 고정했으므로 시스템 다크 모드를 따라가지 않는다
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: colors.cream,
        peach: colors.peach,
        coral: { DEFAULT: colors.coral, deep: colors.coralDeep },
        mint: { DEFAULT: colors.mint, deep: colors.mintDeep },
        rose: { DEFAULT: colors.rose, deep: colors.roseDeep },
        butter: colors.butter,
        ink: { DEFAULT: colors.ink, soft: colors.inkSoft },
      },
    },
  },
  plugins: [],
}
