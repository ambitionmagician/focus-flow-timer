'use strict';
const SCOPE=self.registration.scope;
const PREFIX='focus-flow:'+SCOPE+':';
const CACHE=PREFIX+'shell-v1';
const INDEX=new URL('index.html',SCOPE).href;
const MANIFEST=new URL('manifest.json',SCOPE).href;
const ROOT=new URL(SCOPE).pathname;

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll([INDEX,MANIFEST].map(url=>new Request(url,{cache:'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  let key;
  if(url.pathname===ROOT||url.pathname===new URL(INDEX).pathname)key=INDEX;
  else if(url.pathname===new URL(MANIFEST).pathname)key=MANIFEST;
  else return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const hit=await cache.match(key);
    if(hit)return hit;
    const response=await fetch(key);
    if(response.ok)await cache.put(key,response.clone());
    return response;
  })());
});
