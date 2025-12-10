/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // The key is the class name (e.g., 'rubik' -> font-rubik)
        // The value MUST match the name defined in useFonts in _layout.tsx
        rubik: ['Rubik', 'sans-serif'],
        hebrew: ['TaameyFrank', 'serif'],
        'hebrew-bold': ['TaameyFrank-Bold', 'serif'],
      },
    },
  },
  plugins: [],
}
