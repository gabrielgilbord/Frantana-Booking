/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Fuerza a Next.js a usar este directorio como raíz del workspace
    root: __dirname,
  },
};

module.exports = nextConfig;

