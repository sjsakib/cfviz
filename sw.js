importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js'
);

workbox.precaching.precacheAndRoute([
  { url: '/index.html', revision: '1114' },
  { url: '/about.html', revision: '1111' },
  { url: '/compare.html', revision: '1111' },
  { url: '/virtual-rating-change.html', revision: '1111' },
  { url: '/js/compare_helper.js', revision: '1113' },
  { url: '/js/compare.js', revision: '1111' },
  { url: '/js/calculate.js', revision: '1111' },
  { url: '/js/single.js', revision: '1112' },
  { url: '/js/vir.js', revision: '1111' }
]);

workbox.routing.registerRoute(
  /^((?!codeforces)(?!facebook)(?!analytics).)*$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'local'
  })
);
