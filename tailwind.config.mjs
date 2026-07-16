/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue,svelte}'],
  theme: {
    extend: {
      colors: {
        // Croydon FC — "The Blues"
        // Pulled from the official club crest (navy with light-blue inner)
        club: {
          primary: '#0a1f5c',   // deep navy (crest outer)
          secondary: '#4a7fc1', // mid blue (crest inner)
          accent: '#ffffff',
          dark: '#06143d',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
