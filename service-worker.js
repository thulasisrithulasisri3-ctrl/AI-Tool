"use strict";

const CACHE_NAME = "viggo-ai-v1";

const FILES_TO_CACHE = [
    "/AI-Tool/",
    "/AI-Tool/index.html",
    "/AI-Tool/style.css",
    "/AI-Tool/script.js",
    "/AI-Tool/manifest.json",
    "/AI-Tool/icon-192.png",
    "/AI-Tool/icon-512.png"
];

/* =========================
   INSTALL
========================= */

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(
                    FILES_TO_CACHE
                );

            })

    );

    self.skipWaiting();

});


/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(
                            name =>
                                name !== CACHE_NAME
                        )
                        .map(
                            name =>
                                caches.delete(name)
                        )

                );

            })

    );

    self.clients.claim();

});


/* =========================
   FETCH
========================= */

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request);

            })
            .catch(() => {

                return caches.match(
                    "/AI-Tool/"
                );

            })

    );

});
