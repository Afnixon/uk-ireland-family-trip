const CACHE='family-trip-v3-2026-11-27';
const SHELL=['./','./index.html','./itinerary.html','./flights.html','./accommodation.html','./places.html','./essentials.html','./assets/style.css','./assets/data.js','./assets/app.js','./favicon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 const r=event.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;
 event.respondWith(fetch(r).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{})}return response}).catch(()=>caches.match(r).then(cached=>cached|| (r.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});