/** @type {import('next').NextConfig} */
const nextConfig = {
    // reactStrictMode: true,
    // transpilePackages: ["@repo/logger"],
    webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
        config.module.rules.push({
            test: /\.node$/,
            use: [
                {
                    loader: "nextjs-node-loader",
                },
            ],
        });
        return config;
    },
};

export default nextConfig;
