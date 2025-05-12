/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        contactHover: "#202b36",
        contactSelected: "#2b5278",
        overlay: "#1b1f23",
        ovelayIconColor1: "#488fc9",
        IconNotActive: "#6c7882",
        IconOnHover: "#dcdcdc",
      },
    },
  },
  plugins: [],
};
