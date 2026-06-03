/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        login: "url('/assets/login-bg.jpg')",
        app: "url('/assets/app-bg.jpg')"
      },
      colors: {
        // ── Old-money palette (full scales so utility swaps always resolve) ──
        ink:    { DEFAULT: '#23271f', 50: '#eceee9', 100: '#d6dad0', 200: '#b3bbab', 300: '#8b9683', 400: '#677260', 500: '#4c5645', 600: '#3c4233', 700: '#2f3428', 800: '#23271f', 900: '#15180f' },
        cream:  { DEFAULT: '#f4f1ea', 50: '#faf8f3', 100: '#f4f1ea', 200: '#ece6da', 300: '#ded6c4' },
        sage:   { 50: '#f1f3ee', 100: '#e1e6da', 200: '#c6d0ba', 300: '#a6b596', 400: '#899c78', 500: '#6f8360', 600: '#58694b', 700: '#46543d', 800: '#3a4533', 900: '#30392b' },
        bronze: { DEFAULT: '#a98c5f', 50: '#f6f0e7', 100: '#ece0cd', 200: '#dcc6a2', 300: '#cdb389', 400: '#c2a578', 500: '#a98c5f', 600: '#8c724a', 700: '#6f5a3a', 800: '#574631', 900: '#3e3122' },
        stone2: { DEFAULT: '#7d7668', 50: '#f2f1ed', 100: '#e3e1da', 200: '#ccc8bd', 300: '#b0ab9c', 400: '#9a9384', 500: '#7d7668', 600: '#615b50', 700: '#4b4639', 800: '#393528', 900: '#2a2720' },
        // Reskin the brand accent: existing `lime-*` classes now render as sage,
        // so the whole app picks up the old-money green with no per-file edits.
        lime:   { 50: '#f1f3ee', 100: '#e1e6da', 200: '#c6d0ba', 300: '#a6b596', 400: '#899c78', 500: '#6f8360', 600: '#58694b', 700: '#46543d', 800: '#3a4533', 900: '#30392b' },
      },
      borderRadius: {
        // Sharpen everything — `full` is intentionally left at the default so
        // avatars and status dots stay circular.
        none: '0px',
        sm: '1px',
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '3px',
        '2xl': '4px',
        '3xl': '6px',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Merriweather', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Roboto', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.22em',
      },
    },
  },
  plugins: [],
}
