/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: async () => {
        // Only rewrite to local Uvicorn server during local development.
        // In production on Vercel, requests to /api/* route directly to serverless functions.
        if (process.env.NODE_ENV === 'development') {
            return [
                {
                    source: '/api/:path*',
                    destination: 'http://127.0.0.1:8000/api/:path*',
                },
            ];
        }
        return [];
    },
};

export default nextConfig;
