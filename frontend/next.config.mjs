/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-popover',
      '@radix-ui/react-label'
    ]
  }
};

export default nextConfig;


