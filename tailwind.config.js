/** @type {import('tailwindcss').Config} */

  module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx,vue}",  
  ],
  theme: {
      extend: {
        backgroundImage: {
        'patroon-afas': "url('src/img/patroon_afas.png')",
      }
    },
  },
  plugins: [],
}
 
