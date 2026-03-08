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
    }
    },
  },
  plugins: [],
}