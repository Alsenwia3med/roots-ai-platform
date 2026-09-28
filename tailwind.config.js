/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        roots: {
          bg: "#040D1A",
          surface: "#0F233D",
          primary: "#0A192F",
          accent: "#00E5FF"
        }
      }
    },
  },
  plugins: [],
};
