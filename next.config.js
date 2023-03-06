const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true
})
module.exports = withPWA({
  // next.js config
  async rewrites () {
    return [
      {
        source: '/api/:path*',
        destination: 'https://gold.adanic.me/api/:path*'
      }
    ]
  }
})
