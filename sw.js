"use strict";

var CACHE_NAME = "aef_static";
var CACHE_FILES = [
    'aeftt.html',
    'styles.css',
    'script.js',
    'scenarios.js',
    'modules/model.js',
    'modules/ndview.js',
    'modules/paramview.js',
    'modules/controller.js',
    'icon.svg',
    'icon-180x180.png',
    'aeftt.webmanifest',
];


function fill_cache(cache) {
    return cache.addAll(CACHE_FILES);
}


function install_sw(event) {
    event.waitUntil(
        self.caches.open(CACHE_NAME).then(fill_cache));
}


function do_fetch(event) {
    event.respondWith(
        self.fetch(event.request, {cache: "no-store"}).then(
            function(response) {
                let rclone = response.clone();
                self.caches.open(CACHE_NAME).then(
                    function (cache) {
                        cache.put(event.request, rclone);
                    });
                return response;
            }).catch(
                function() {
                    return self.caches.match(event.request);
            })
    );
}

self.addEventListener('install', install_sw);
self.addEventListener('fetch', do_fetch);
