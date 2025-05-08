/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        contactHover: "#202b36",
        contactSelected: "#2b5278",
      },
    },
  },
  plugins: [],
};
