"use strict";

const CACHE_NAME = "viggo-ai-v2";

const BASE = "/AI-Tool/";

const FILES_TO_CACHE = [
  BASE,
  BASE + "index.html",
  BASE + "style.css",
  BASE + "script.js",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png"
];


/* =========================================
   INSTALL
========================================= */

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


/* =========================================
   ACTIVATE
========================================= */

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


/* =========================================
   FETCH
========================================= */

self.addEventListener("fetch", event => {

  const request =
    event.request;

  /* ---------------------------------------
     API requests
     NEVER CACHE
  --------------------------------------- */

  if (
    request.url.includes(
      "ai-tool-1-fgmc.onrender.com"
    )
  ) {

    return;

  }


  /* ---------------------------------------
     HTML / CSS / JS
     NETWORK FIRST
  --------------------------------------- */

  if (
    request.method === "GET" &&
    (
      request.destination === "document" ||
      request.destination === "script" ||
      request.destination === "style"
    )
  ) {

    event.respondWith(

      fetch(request)
        .then(response => {

          const responseClone =
            response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {

              cache.put(
                request,
                responseClone
              );

            });

          return response;

        })
        .catch(() => {

          return caches.match(
            request
          );

        })

    );

    return;

  }


  /* ---------------------------------------
     OTHER FILES
     CACHE FIRST
  --------------------------------------- */

  event.respondWith(

    caches.match(request)
      .then(cachedResponse => {

        if (cachedResponse) {

          return cachedResponse;

        }

        return fetch(request);

      })

  );

});
