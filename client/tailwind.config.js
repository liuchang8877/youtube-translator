/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11131a",
        mint: "#b7ffd8",
        coral: "#ff7a59",
        sand: "#f3efe7",
        ocean: "#0f3d3e"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        serif: ["'Fraunces'", "serif"]
      },
      boxShadow: {
        soft: "0 20px 50px rgba(17, 19, 26, 0.15)"
      }
    }
  },
  plugins: []
};
