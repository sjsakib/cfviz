importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

workbox.routing.registerRoute(
  /^((?!codeforces).)*$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'local',
  }),
);

workbox.precaching.precacheAndRoute([
  '/about.html',
  '/compare.html',
  '/virtual-rating-change.html',
]);

