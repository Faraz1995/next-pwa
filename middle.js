const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const app = express()

app.use(
  '/api',
  createProxyMiddleware({
    target: 'http://localhost:4040',
    changeOrigin: true,
    pathRewrite: { '^/api/v1': '' }
  })
)
app.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:3000/',
    changeOrigin: true
  })
)
// port to use on browser
app.listen(3004)
