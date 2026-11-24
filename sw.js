// ぬくまど(体験版)の サービスワーカー。tools/build_lite.py が web/sw.js の かわりに 置く。
// 開いた ことの ある 画面を この 端末に 覚えて、つながらない ときも 開ける ように する。
// いつもは 新しい ほうを 取りに 行き、だめな ときだけ 覚えた ものを 出す。
// 見るのは この サイトの ファイルだけ(外へは 何も 取りに 行かない)。api/… は 画面の 中(lite/api.js)で 答えるので ここには 来ない
const CACHE = "nukumado-1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", e => {
  e.waitUntil(
    caches
      .keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  const keep = res => {
    if (res.ok) {
      const c = res.clone();
      caches.open(CACHE).then(x => x.put(r, c));
    }
    return res;
  };
  const old = () => caches.match(r, {ignoreSearch: true}).then(m => m || Response.error());
  e.respondWith(fetch(r).then(keep).catch(old));
});
