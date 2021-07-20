importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js'
);

workbox.precaching.precacheAndRoute([
  { url: '/index.html', revision: '1119' },
  { url: '/about.html', revision: '1115' },
  { url: '/compare.html', revision: '11154' },
  { url: '/virtual-rating-change.html', revision: '1117' },
  { url: '/js/compare_helper.js', revision: '1115' },
  { url: '/js/compare.js', revision: '1112' },
  { url: '/js/calculate.js', revision: '1113' },
  { url: '/js/single.js', revision: '1114' },
  { url: '/js/vir.js', revision: '1115' },
]);

workbox.routing.registerRoute(
  /^((?!codeforces)(?!facebook)(?!analytics)(?!ads)(?!google).)*$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'local',
  })
);
