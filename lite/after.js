// ぬくまど(体験版)の 仕上げ: common.js の すぐ 後に 読む(tools/build_lite.py が 差しこむ)。
// 元の 画面の コードは 変えずに、体験版に 無い ものを しまう。
// - 字の フォント: 体験版には fonts/ が 無いので「いまのまま」だけ(⚙️ の「字のフォント」は 出さない)
// - ⚙️ せってい: 🔗 れんけい の タブ・写真の 背景・💾 控え の 行を しまう。
//   かわりに「記録は この ブラウザの 中だけ」と ぜんぶ けす ボタン
(() => {
  if (typeof G === "undefined") return;
  const N0 = window.NUKUMADO || {};
  if (!N0.fonts) G._in.FONTS.splice(1); /* fonts/ を 入れて いない 体験版では「いまのまま」だけ */
  const byText = (sel, t, root = document) => [...root.querySelectorAll(sel)].find(e => e.textContent.includes(t));
  const drop = e => {
    if (e) e.remove();
  };
  function eraseAll() {
    if (!confirm("この ブラウザに 残した ぬくまど の 記録(スタンプ・カード・たな・せってい)を ぜんぶ けしますか?")) return;
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    if (window.caches) caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))));
    location.replace("./");
  }
  /* 控え: nukumado: で 始まる 記録を 1 つの ファイルに(スマホを 替える とき 用)。読みこむと いまの 記録と 入れかわる */
  function backupOut() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith("nukumado:") || k.startsWith("gojiai-")) data[k] = localStorage.getItem(k);
    }
    const a = G.el("a"),
      d = new Date();
    a.href = URL.createObjectURL(new Blob([JSON.stringify({nukumado: 1, at: d.toISOString(), data})], {type: "application/json"}));
    a.download = `nukumado-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    G.toast("控えの ファイルを 作りました");
  }
  function backupIn(file) {
    const r = new FileReader();
    r.onload = () => {
      let j = null;
      try {
        j = JSON.parse(r.result);
      } catch (e) {}
      if (!j || j.nukumado !== 1 || !j.data || typeof j.data !== "object") return G.toast("ぬくまど の 控えの ファイルでは ありません");
      if (!confirm("いまの 記録を、この 控えの 中身に 入れかえますか?")) return;
      for (const k of Object.keys(localStorage)) if (k.startsWith("nukumado:") || k.startsWith("gojiai-")) localStorage.removeItem(k);
      for (const [k, v] of Object.entries(j.data))
        if ((k.startsWith("nukumado:") || k.startsWith("gojiai-")) && typeof v === "string") localStorage.setItem(k, v);
      location.replace("./");
    };
    r.readAsText(file);
  }
  /* こまった・こうして ほしい: どんな こと・どこの こと・ひとこと を 入れて、フォーム(か GitHub の Issue)を 開く。機種 などは 自動で 入る */
  function feedback() {
    const N = window.NUKUMADO || {},
      box = G.el("div", "lite-fb"),
      kind = G.el("select"),
      app = G.el("select"),
      txt = G.el("textarea"),
      go = G.el("button", "btn", N.form ? "📮 Google フォームへ 送信" : "📮 GitHub へ 送る");
    for (const k of ["こまった", "こうして ほしい", "そのほか"]) kind.append(G.el("option", null, k));
    for (const k of ["入口", "ごじあい", "ひといき", "せってい", "はじめての しつもん", "そのほか"]) app.append(G.el("option", null, k));
    kind.setAttribute("aria-label", "どんな こと");
    app.setAttribute("aria-label", "どこの こと");
    txt.rows = 4;
    txt.placeholder = "どう なった・どう なったら うれしい か(名前や 住所は 書かないでね)";
    go.type = "button";
    go.onclick = () => {
      const t = txt.value.trim();
      if (!t) return G.toast("ひとこと 書いてね");
      const env = `ぬくまど 体験版 ${N.ver || ""} / ${navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 120)} / ${innerWidth}x${innerHeight}`;
      let u = "";
      if (N.form && N.formIds) {
        const o = N.formOpts || {},
          pick = v => o[v] || v.replace(/\s+/g, "") /* フォームの 言葉に 合わせる(無ければ 空白を 取った もの) */,
          q = new URLSearchParams({
            usp: "pp_url",
            [N.formIds.kind]: pick(kind.value),
            [N.formIds.app]: pick(app.value),
            [N.formIds.what]: t,
            [N.formIds.env]: env,
          });
        /* 「そのほか」は フォームの「その他」に: えらんだ しるし と、書き入れる 文字の 両方が 要る */
        for (const id of [N.formIds.kind, N.formIds.app]) if (q.get(id) === "__other_option__") q.set(id + ".other_option_response", "そのほか");
        u = N.form + (N.form.includes("?") ? "&" : "?") + q;
      } else if (N.repo) {
        const bug = kind.value === "こまった",
          q = new URLSearchParams({
            template: bug ? "komatta.yml" : "hoshii.yml",
            title: (bug ? "[こまった] " : "[ほしい] ") + t.slice(0, 40),
            what: t,
            env,
          });
        u = N.repo + "/issues/new?" + q;
      }
      if (u) window.open(u, "_blank", "noopener");
    };
    box.append(kind, app, txt, go);
    if (N.form && N.repo) {
      const gh = G.el("a", "sub", "GitHub の アカウントが ある 人は、こちらでも(スクリーンショットを 貼れます)");
      gh.href = N.repo + "/issues/new/choose";
      gh.target = "_blank";
      gh.rel = "noopener";
      box.append(gh);
    }
    return box;
  }
  /* ⚙️ の いちばん下「この アプリに ついて」 */
  function about() {
    const N = window.NUKUMADO || {},
      box = G.el("div", "lite-note"),
      out = G.el("button", "btn", "📦 控えを 取る"),
      inn = G.el("button", "btn", "📥 控えを 戻す"),
      file = G.el("input"),
      er = G.el("button", "btn", "🧹 この ブラウザの 記録を ぜんぶ けす"),
      more = G.el("a", "btn", "📸 画面を 見る(公開予定)");
    out.type = inn.type = er.type = "button";
    file.type = "file";
    file.accept = "application/json,.json";
    file.hidden = true;
    out.onclick = backupOut;
    inn.onclick = () => file.click();
    file.onchange = () => file.files[0] && backupIn(file.files[0]);
    er.onclick = eraseAll;
    more.href = "more.html";
    const pair = G.el("div", "lite-pair");
    pair.append(out, inn);
    /* 見出しは 枠の 外、中身は 枠の 中 */
    const sec = (title, help, ...kids) => {
      const b = G.el("div", "box lite-sec"),
        h = G.el("h2", null, title + " ");
      b.append(...kids);
      box.append(h);
      if (help) {
        /* 説明は ？ の 中 */
        const q = G.el("button", "q", "？"),
          p = G.el("p", "sub", help);
        q.type = "button";
        q.setAttribute("aria-label", title + " の 説明");
        p.hidden = true;
        q.onclick = () => {
          p.hidden = !p.hidden;
        };
        h.append(q);
        box.append(p);
      }
      box.append(b);
      return b;
    };
    const keep = sec(
      "💾 記録と 控え",
      "記録は この ブラウザの 中だけに 残ります(どこにも 送りません)\nスマホを 替える ときは、控えを 取って 新しい スマホで 戻せます。",
      G.el("p", "sub", `🧪 ぬくまど 体験版${N.ver ? " " + N.ver : ""}`),
      pair,
      file,
    );
    if (N.form || N.repo)
      sec(
        "📮 こまった・こうして ほしい",
        "どこの ことか を えらんで、ひとこと 書いて ください。つかって いる 機種 などは 自動で 入ります。",
        feedback(),
      );
    sec("📱 正式アプリ版", "", more);
    keep.append(er); /* ぜんぶ けす は 記録と 控え の 枠の 中 */
    if (N.repo) {
      const lic = G.el("a", "sub", "ライセンス(コード: AGPL-3.0。絵と 音は 作者の もの)");
      lic.href = N.repo + "#readme";
      lic.target = "_blank";
      lic.rel = "noopener";
      box.append(lic);
    }
    return box;
  }
  function tidy(root) {
    const lk = byText("#tabs .tab", "れんけい");
    drop(lk);
    if (location.hash === "#links") {
      const first = document.querySelector("#tabs .tab");
      if (first) first.click();
    }
    const fh = !N0.fonts && byText("h2", "字のフォント", root);
    if (fh) {
      drop(fh.nextElementSibling);
      fh.remove();
    }
    drop(byText("button.btn", "写真をえらぶ", root));
    const sc = byText("p.sub", "Claude さんに", root);
    if (sc) sc.textContent = sc.textContent.replace(/ここに無いアプリは[^。]*。/, "");
    /* ℹ️ このアプリ の タブ: 体験版では 控えの 行(毎晩 自動)を、体験版の 中身(控えを 取る・戻す・窓口・けす)に 入れかえる */
    const bk = byText("p.sub", "控え", root);
    if (bk) {
      const bx = bk.closest(".box") || bk,
        h = bx.previousElementSibling;
      if (h && h.tagName === "H2" && h.textContent.includes("控え")) h.remove();
      bx.replaceWith(about());
    }
  }
  /* 体験版には 📚 たな が 無いので、ひといき の「たな に 好きなものを 入れると…」を 消す。
     🪷 瞑想 は 読み上げ(こえ)が 無いと できないので 出さない */
  window.HK_SKIP = ["meiso", "meiso3"];
  new MutationObserver(() => {
    for (const h of document.querySelectorAll(".hint")) if (h.textContent.includes("たな")) h.remove();
    for (const t of document.querySelectorAll(".tl")) if (t.querySelector(".hd b")?.textContent === "瞑想") t.remove();
  }).observe(document.documentElement, {childList: true, subtree: true});
  /* ブラウザの タブの 名前: 入口は「ぬくまど 体験版」、ほかは「◯◯ — ぬくまど 体験版」(common.js が 入口の 名前に 書きかえる のを 直す。) */
  const NAME = "ぬくまど 体験版";
  const isHome = /(^|\/)(index\.html)?$/.test(location.pathname);
  const fixTitle = () => {
    const t = document.title;
    if (t.endsWith(NAME)) return;
    document.title = isHome || !t ? NAME : `${t} — ${NAME}`;
  };
  fixTitle();
  new MutationObserver(fixTitle).observe(document.querySelector("title") || document.head, {childList: true, subtree: true, characterData: true});
  /* settei.js が G.settei を 置いた とき、終わった あとに tidy を 足す */
  let st = null;
  Object.defineProperty(G, "settei", {
    configurable: true,
    get: () => st,
    set: f => {
      st = async root => {
        await f(root);
        tidy(root);
      };
    },
  });
})();
