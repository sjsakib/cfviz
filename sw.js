importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js'
);

workbox.precaching.precacheAndRoute([
  { url: '/index.html', revision: '1117' },
  { url: '/about.html', revision: '1113' },
  { url: '/compare.html', revision: '1113' },
  { url: '/virtual-rating-change.html', revision: '1115' },
  { url: '/js/compare_helper.js', revision: '1113' },
  { url: '/js/compare.js', revision: '1111' },
  { url: '/js/calculate.js', revision: '1112' },
  { url: '/js/single.js', revision: '1112' },
  { url: '/js/vir.js', revision: '1113' }
]);

workbox.routing.registerRoute(
  /^((?!codeforces)(?!facebook)(?!analytics)(?!ads)(?!google).)*$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'local'
  })
);
