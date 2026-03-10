const webpack = require('webpack');

module.exports = {
    devServer: {
        port: 8081,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                pathRewrite: { '^/api': '' }
            }
        },
        watchOptions: {
            poll: 1000, 
        }
    },
    configureWebpack: {
        plugins: [
            new webpack.DefinePlugin({
                __VUE_OPTIONS_API__: true,
                __VUE_PROD_DEVTOOLS__: false,
                __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
            }),
        ],
        optimization: {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    // Tách vendor libraries
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 10
                    },
                    // Tách Element Plus
                    elementPlus: {
                        test: /[\\/]node_modules[\\/]element-plus[\\/]/,
                        name: 'element-plus',
                        chunks: 'all',
                        priority: 20
                    },
                    // Tách Leaflet
                    leaflet: {
                        test: /[\\/]node_modules[\\/]leaflet[\\/]/,
                        name: 'leaflet',
                        chunks: 'all',
                        priority: 15
                    },
                    // Tách common code giữa các async chunks
                    common: {
                        minChunks: 2,
                        chunks: 'all',
                        enforce: true,
                        priority: 5
                    }
                }
            }
        }
    },
};
