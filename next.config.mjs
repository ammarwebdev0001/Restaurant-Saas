/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint 9 + legacy .eslintrc can throw "circular structure to JSON" during `next build`; lint via `npm run lint` locally.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'images.unsplash.com',
      'openweathermap.org',
      'pbs.twimg.com',
      'via.placeholder.com',
    ],
  },
  env: {
    WEATHER_API: process.env.WEATHER_API,
  },
};

export default nextConfig;
