var path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // These alias configurations are not required. They are only needed for development in the mono repo's example/ folder
    config.resolve.alias["next"] = path.resolve("./node_modules/next");
    config.resolve.alias["next-auth"] = path.resolve(
      "./node_modules/next-auth"
    );
    config.resolve.alias["react"] = path.resolve("./node_modules/react");
    return config;
  },
};

module.exports = nextConfig;
