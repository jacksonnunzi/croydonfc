import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://croydonfc.netlify.app',
  integrations: [tailwind()],
});
