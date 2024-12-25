const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
    ...config,
    server: {
        port: 8081,
        enhanceMiddleware: (middleware) => {
            return (req, res, next) => {
                // Add CORS headers
                res.setHeader('Access-Control-Allow-Origin', '*');
                return middleware(req, res, next);
            };
        },
    },
    resolver: {
        ...config.resolver,
        sourceExts: [...config.resolver.sourceExts, 'cjs']
    }
};
