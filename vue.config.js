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
    }
}
