// Modo offline do Imagina 3D.
// Guarda a página e os arquivos do Firebase no aparelho.
// Quando não há internet, usa a cópia guardada.

const CACHE = "imagina3d-v1";
const ARQUIVOS_INICIAIS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARQUIVOS_INICIAIS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(c => c !== CACHE).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const eNosso = url.origin === self.location.origin;
  const eFirebase = url.hostname === "www.gstatic.com";
  if (!eNosso && !eFirebase) return;

  // Tenta a internet primeiro (sempre pega a versão mais nova).
  // Se falhar, usa a cópia guardada no aparelho.
  event.respondWith(
    fetch(req)
      .then(resposta => {
        if (resposta && (resposta.ok || resposta.type === "opaque")) {
          const copia = resposta.clone();
          caches.open(CACHE).then(cache => cache.put(req, copia));
        }
        return resposta;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(achado => {
          if (achado) return achado;
          if (req.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        })
      )
  );
});
