import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2F9BF1',
          gold: '#C9A227',
          navy: '#16223A',
        },
      },
    },
  },
  plugins: [],
};

export default config;
