import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://croydonfootballclub.com.au',
  integrations: [tailwind()],
});
