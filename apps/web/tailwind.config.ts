import type { Config } from 'tailwindcss';
import { campusOSTailwindPreset } from '@campus-os/ui-kit/tailwind-preset';

const config: Config = {
  presets: [campusOSTailwindPreset as any],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui-kit/src/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
};

export default config;
