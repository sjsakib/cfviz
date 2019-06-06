importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

workbox.routing.registerRoute(
  /^((?!codeforces).)*$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'local',
  }),
);

workbox.precaching.precacheAndRoute([
  '/index.html',
  '/about.html',
  '/compare.html',
  '/virtual-rating-change.html',
  '/js/compare_helper.js',
  '/js/compare.js',
  '/js/calculate.js',
  '/js/vir.js',
]);

