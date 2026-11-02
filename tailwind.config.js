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
        // 레퍼런스(prototype_reference) 디자인 토큰
        ink: colors.ink,
        muted: colors.muted,
        faint: colors.faint,
        accent: { DEFAULT: colors.accent, soft: colors.accentSoft, tint: colors.accentTint },
        paper: colors.paper,
        surface: colors.surface,
        line: { DEFAULT: colors.line, soft: colors.lineSoft },
        ok: { DEFAULT: colors.ok, soft: colors.okSoft, text: colors.okText },
        warn: { DEFAULT: colors.warn, soft: colors.warnSoft, text: colors.warnText, dot: colors.dot },

      },
    },
  },
  plugins: [],
}
