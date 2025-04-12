module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'dex-blue': '#3b82f6',
        'dex-green': '#10b981',
      },
      boxShadow: {
        'dex': '0 4px 24px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
}