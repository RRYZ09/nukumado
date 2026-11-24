// ごじあい: どのアプリの画面でも使う部品。上の帯・タブ(apps.json)・明るい暗い・サーバーとのやりとり・はんこ。
// アプリの一覧は apps.json(pages = そのアプリの中のタブ)。画面を足すときは html を1枚置き、pages に1行足し、<script>G.start("画面の id", render)</script> と書く。
// 端末を またいで 同じに。
// どの アプリも 端末に 覚えて いた もの(localStorage)を サーバー(api/kv、apps/kv.py)と そろえる。ほかの スクリプトより 先に 動くよう いちばん 上で、
// 開いた ときに 1 回 だけ 待って 読む(サーバー が 勝つ)。書いた・けした ものは すぐ 送る。サーバー に 無くて 端末に だけ ある ものは 1 回 送る(引っこし)
(() => {
  const SKIP = /^(gw-wxll|gojiai-fade)/; // 端末ごとの まま: その 端末の 場所(天気用)・🕰️ ひらいた記録 の うすくする 時間(スクリーンタイムの 設定。)
  const NS = (seg => (seg && seg !== "gojiai" && !seg.includes(".") ? "@" + seg : ""))(location.pathname.split("/")[1] || "");
  if (NS || /HeadlessChrome/.test(navigator.userAgent)) return; // 確かめ用の ブラウザ(Claude の 撮影)は 書かない。もう ひとりの 版(/kazeo-app/)は 持ち主が 確かめに 見るだけ なので 端末ごとの まま
  const mine = k => !SKIP.test(k) && !k.includes("@"); // ほかの 版の しるし(@kazeo-app など)が 付いた ものは 送らない
  let ls;
  try {
    ls = window.localStorage;
    ls.length;
  } catch (e) {
    return;
  }
  const P = Storage.prototype,
    set0 = P.setItem,
    rem0 = P.removeItem;
  let kv = null;
  try {
    const x = new XMLHttpRequest();
    x.open("GET", "api/kv?t=" + Date.now(), false);
    x.send();
    if (x.status === 200) kv = JSON.parse(x.responseText);
  } catch (e) {}
  if (!kv || typeof kv !== "object") return; // つながらない ときは 端末の ものだけで(送るのも しない)
  const out = {};
  for (const [k, v] of Object.entries(kv)) {
    if (!mine(k)) continue;
    if (v === null) rem0.call(ls, k);
    else if (ls.getItem(k) !== v) set0.call(ls, k, v);
  }
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (mine(k) && !(k in kv)) out[k] = ls.getItem(k);
  }
  let tm = 0;
  const flush = () => {
    tm = 0;
    const b = JSON.stringify({set: out});
    for (const k in out) delete out[k];
    try {
      fetch("api/kv", {method: "POST", headers: {"Content-Type": "application/json"}, body: b, keepalive: b.length < 60000}).catch(() => {});
    } catch (e) {}
  };
  const queue = (k, v) => {
    if (!mine(k)) return;
    out[k] = v;
    if (!tm) tm = setTimeout(flush, 400);
  };
  P.setItem = function (k, v) {
    set0.call(this, k, v);
    if (this === ls) queue(String(k), String(v));
  };
  P.removeItem = function (k) {
    rem0.call(this, k);
    if (this === ls) queue(String(k), null);
  };
  addEventListener("pagehide", () => {
    if (tm) {
      clearTimeout(tm);
      flush();
    }
  });
  if (Object.keys(out).length) tm = setTimeout(flush, 400);
})();

const G = (() => {
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const KIND = {
    nuku: "ぬくぬく",
    gohan: "ごはん",
    nomi: "のみもの",
    furo: "おふろ",
    kibun: "きぶんてんかん",
    soto: "そと",
    hito: "ひと",
    neru: "ねるじゅんび",
  };
  let S = null,
    onState = null;

  // 端末に覚えるときの名前。ほかの人の版(/kazeo-app/ など)は 名前に しるしを付けて、同じ端末でも ごじあい と別々に覚える
  const NS = (seg => (seg && seg !== "gojiai" && !seg.includes(".") ? "@" + seg : ""))(location.pathname.split("/")[1] || "");
  const LS = k => k + NS;

  // 明るい・暗い: せってい →「見た目」で選ぶ(auto = スマホに合わせる)。この端末だけに覚える
  const sysDark = matchMedia("(prefers-color-scheme: dark)");
  let mode = null;
  try {
    mode = localStorage.getItem(LS("gojiai-theme"));
  } catch (e) {}
  if (mode === null)
    mode = "light"; /* まだ えらんで いなければ 明るい(おまかせ だと スマホの 暗い 設定で 背景が とても 暗く なる。) */
  if (mode !== "dark" && mode !== "light") mode = "auto";
  let theme = mode === "auto" ? (sysDark.matches ? "dark" : "light") : mode;
  document.documentElement.dataset.theme = theme;
  function setMode(m) {
    mode = m;
    applyRest();
    try {
      localStorage.setItem(LS("gojiai-theme"), m); /* おまかせ も「auto」と 覚える(覚えて いない = 明るい) */
    } catch (e) {}
    paint();
    wall();
  }
  sysDark.addEventListener("change", () => {
    if (mode === "auto") setMode("auto");
  });

  // 全画面: せってい →「見た目」。この端末だけに覚える。画面を移ると全画面は外れる(ブラウザの決まり)ので、次に触れたときに入り直す
  let full = false;
  try {
    full = localStorage.getItem(LS("gojiai-full")) === "1";
  } catch (e) {}
  const canFull = !!document.documentElement.requestFullscreen;
  const goFull = () => {
    if (full && canFull && !document.fullscreenElement) document.documentElement.requestFullscreen({navigationUI: "hide"}).catch(() => {});
  };
  addEventListener("pointerup", goFull, true);
  function setFull(v) {
    full = v;
    try {
      v ? localStorage.setItem(LS("gojiai-full"), "1") : localStorage.removeItem(LS("gojiai-full"));
    } catch (e) {}
    if (v) goFull();
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  // ぷるん: ボタンを押すと つぶれて、はなすと ぷるんと戻る。せってい →「見た目」。この端末だけに覚える(はじめはオン)
  let puru = true;
  try {
    puru = localStorage.getItem(LS("gojiai-puru")) !== "0";
  } catch (e) {}
  document.documentElement.toggleAttribute("data-puru", puru);
  function setPuru(v) {
    puru = v;
    document.documentElement.toggleAttribute("data-puru", v);
    try {
      v ? localStorage.removeItem(LS("gojiai-puru")) : localStorage.setItem(LS("gojiai-puru"), "0");
    } catch (e) {}
  }
  // 字のフォント: せってい →「見た目」。この端末だけに覚える。フォントは web/fonts/ に写してある(tools/get_fonts.py。一覧を変えたら あちらも)
  const FONTS = [
    ["", "いまのまま", null, ""],
    ["mplus", "まるい", "M PLUS Rounded 1c", "400;700;800"],
    ["zenmaru", "やわらか", "Zen Maru Gothic", "400;700;900"],
    ["kosugi", "すっきり丸", "Kosugi Maru", ""],
    ["noto", "ふつう", "Noto Sans JP", "400;700;800"],
    ["kaku", "かっちり", "Zen Kaku Gothic New", "400;700;900"],
    ["klee", "教科書", "Klee One", "400;600"],
    ["yomogi", "手がき", "Yomogi", ""],
    ["hachi", "ポップ", "Hachi Maru Pop", ""],
    ["dot", "ドット", "DotGothic16", ""],
    ["mincho", "明朝", "Shippori Mincho", "400;700;800"],
  ];
  const fontUrl = f => `fonts/${f[0]}.css`; // この PC に写してあるもの(tools/get_fonts.py)。外には取りにいかない
  const fontLink = (id, href) => {
    let l = document.getElementById(id);
    if (!l) {
      l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      document.head.append(l);
    }
    if (l.href !== href) l.href = href;
  };
  let font = "";
  try {
    font = localStorage.getItem(LS("gojiai-font")) || "";
  } catch (e) {}
  function setFont(k, keep) {
    const f = FONTS.find(x => x[0] === k) || FONTS[0];
    font = f[0];
    const st = document.documentElement.style;
    if (f[2]) {
      fontLink("gfont", fontUrl(f));
      const v = `"${f[2]}","Hiragino Maru Gothic ProN","BIZ UDPGothic","Yu Gothic UI",system-ui,sans-serif`;
      st.setProperty("--maru", v);
      st.setProperty("--head", v);
    } else {
      st.removeProperty("--maru");
      st.removeProperty("--head");
    }
    if (!keep)
      try {
        font ? localStorage.setItem(LS("gojiai-font"), font) : localStorage.removeItem(LS("gojiai-font"));
      } catch (e) {}
  }
  if (font) setFont(font, true);
  // 入口の字の色(時計とアプリの名前): この端末だけに覚える。空なら背景に合わせて おまかせ
  let homeInk = "";
  try {
    const v = localStorage.getItem(LS("gojiai-ink")) || "";
    if (/^#[0-9a-f]{6}$/i.test(v)) homeInk = v;
  } catch (e) {}
  function setInk(v) {
    homeInk = v;
    try {
      v ? localStorage.setItem(LS("gojiai-ink"), v) : localStorage.removeItem(LS("gojiai-ink"));
    } catch (e) {}
    wall();
  }

  // つや: アプリの四角を つやっとさせる。せってい →「見た目」。この端末だけに覚える(はじめはオン)
  let tsuya = true;
  try {
    tsuya = localStorage.getItem(LS("gojiai-tsuya")) !== "0";
  } catch (e) {}
  document.documentElement.toggleAttribute("data-tsuya", tsuya);
  function setTsuya(v) {
    tsuya = v;
    document.documentElement.toggleAttribute("data-tsuya", v);
    try {
      v ? localStorage.removeItem(LS("gojiai-tsuya")) : localStorage.setItem(LS("gojiai-tsuya"), "0");
    } catch (e) {}
  }
  const PURU = "button, a.app, a.tab, a.btn, a.back, header a, [role=button], input[type=submit], input[type=button]"; // summary は入れない: 横に長いので、ちぢむと 中のチェックが指の下から ずれて、押せなくなる
  let held = null;
  addEventListener(
    "pointerdown",
    ev => {
      if (!puru || document.body.classList.contains("arrange")) return;
      const t = ev.target.closest && ev.target.closest(PURU);
      if (!t || t.disabled) return;
      held = t;
      t.classList.remove("puru");
      t.classList.add("pr");
    },
    true,
  );
  const letGo = () => {
    const t = held;
    held = null;
    if (!t) return;
    t.classList.remove("pr");
    void t.offsetWidth;
    t.classList.add("puru");
    t.addEventListener("animationend", () => t.classList.remove("puru"), {once: true});
  };
  addEventListener("pointerup", letGo, true);
  addEventListener("pointercancel", letGo, true);

  const band = h => (h >= 4 && h < 10 ? "asa" : h >= 10 && h < 17 ? "hiru" : h >= 17 && h < 22 ? "yoru" : "neru");

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("on"), 1800);
  }

  async function api(path, body) {
    const r = await fetch(
      path,
      body ? {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)} : {cache: "no-store"},
    );
    if (!r.ok) throw new Error(r.status);
    S = await r.json();
    if (onState) onState(S);
    return S;
  }

  async function stamp(s) {
    $("he").textContent = s.e;
    const hk = $("hanko");
    hk.classList.remove("on");
    void hk.offsetWidth;
    hk.classList.add("on");
    setTimeout(() => hk.classList.remove("on"), 950);
    if (navigator.vibrate) navigator.vibrate(30);
    try {
      await api("api/stamp", s);
    } catch (e) {
      toast("スタンプを残せませんでした");
    }
  }

  // ---- 絵文字・名前・帯の色(入口 = home と、アプリごと。ui.json に覚える) ----
  const COLORS = [
    ["テラコッタ", "#B84E33"],
    ["青緑", "#2E837B"],
    ["からし", "#9A6C1E"],
    ["あい", "#3F6A9A"],
    ["すみれ", "#5B4B8A"],
    ["もも", "#B5506E"],
    ["もり", "#4E7A3A"],
    ["すみ", "#4A403A"],
  ];
  let shell = {apps: [], ui: {home: {e: "📱", t: "アプリ", c: "#5B4B8A"}, apps: {}}},
    scope = "home";
  const look = id => (id === "home" ? shell.ui.home : {...(shell.apps.find(a => a.id === id) || {}), ...(shell.ui.apps[id] || {})});

  // ---- 🪼 ようせいさん(yousei.js・yousei.css)。入口に住む子。せってい →「🪼 ようせい」で 住まわせる・色・動き。設定はこの端末だけ ----
  let ysLoad = null;
  const needYousei = () =>
    ysLoad ||
    (ysLoad = new Promise((ok, ng) => {
      // 使うときだけ読みこむ
      const l = el("link");
      l.rel = "stylesheet";
      l.href = "yousei.css";
      document.head.append(l);
      const sc = el("script");
      sc.src = "yousei.js";
      sc.onload = () => ok(Yousei);
      sc.onerror = ng;
      document.head.append(sc);
    }));
  const ysWanted = () => {
    try {
      return Object.values((JSON.parse(localStorage.getItem(LS("gojiai-yousei-cfg")) || "{}") || {}).on || {}).some(Boolean);
    } catch (e) {
      return false;
    }
  };
  async function liveYousei() {
    // 入口: 画面ぜんたいに重ねた層の中を動き回る。休むのは アプリの四角の上
    const Y = await needYousei(),
      cfg = Y.load();
    if (!Y.anyOn(cfg) || $("ys-layer")) return;
    const layer = el("div");
    layer.id = "ys-layer";
    document.body.append(layer);
    let cold = false;
    const feel = async () => {
      try {
        const d = await (await fetch("api/state", {cache: "no-store"})).json(),
          h = (d.env || {}).here;
        cold = !!(h && h.temp != null && h.temp < (h.out ? 10 : 19));
      } catch (e) {}
    };
    feel();
    setInterval(feel, 300000);
    const ctrl = Y.mount(layer, {
      cfg,
      bottom: 84,
      calm: 3,
      onGive: c => Y.save(c),
      spots: () => (homeBox ? [...homeBox.querySelectorAll(".app .ic")] : []),
      mood: () => {
        const h = new Date().getHours();
        return resting() || h < 5 ? 2 : cold ? 1 : 0;
      },
    }); // おやすみモード・夜ふけは ねむい、いるところが寒いと さむい
    // 🎁 あげる: 上の帯のボタンで、はなしかける欄の上に お盆を出す
    const bar = el("div");
    bar.id = "ys-traybar";
    bar.hidden = true;
    const box = el("div");
    bar.append(box);
    document.body.append(bar);
    Y.tray(box, ctrl);
    const gift = el("button", null, "🎁");
    gift.title = "ようせいさんに あげる";
    gift.onclick = () => {
      bar.hidden = !bar.hidden;
    };
    const moon = $("moon");
    if (moon) moon.before(gift);
  }

  // ---- 🌙 おやすみモード(apps/oyasumi.py。api/ui の rest)。入っているあいだは暗くして、入口は keep のアプリだけ ----
  const resting = () => !!(shell.ui.rest && shell.ui.rest.on);
  function applyRest() {
    const on = resting();
    document.documentElement.toggleAttribute("data-rest", on);
    theme = on ? "dark" : mode === "auto" ? (sysDark.matches ? "dark" : "light") : mode;
    document.documentElement.dataset.theme = theme;
    const b = $("moon");
    if (b) b.classList.toggle("on", on);
    const line = $("restline");
    if (line) {
      line.hidden = !on;
      line.textContent = on ? `🌙 おやすみモード(${shell.ui.rest.until} まで)・おわる` : "";
    }
  }
  async function setRest(body) {
    const was = resting();
    try {
      const r = await fetch("api/rest", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
      if (!r.ok) throw 0;
      shell.ui = await r.json();
    } catch (e) {
      toast("切りかえられませんでした");
      return false;
    }
    applyRest();
    paint();
    if (homeBox) {
      wall();
      tiles();
    }
    if (!was && resting() && body.on) goodnight();
    else if (was && !resting()) toast("おやすみモードを おわりました");
    return true;
  }
  async function goodnight() {
    // 入ったときに1回だけ: ついているものがあれば、消すかどうか
    let on = [];
    toast("🌙 おやすみモードにしたよ"); // おうちの返事は数秒かかることがあるので、先にひとこと
    try {
      const d = await (await fetch("api/ouchi", {cache: "no-store"})).json();
      for (const r of d.rooms || []) {
        if (r.light && r.light.on) on.push([`💡 ${r.room}の電気`, {key: r.light.key, on: false}]);
        if (r.tv && r.tv.on) on.push(["📺 テレビ", {key: "tv", on: false}]);
      }
      if (d.tv && d.tv.on) on.push(["📺 テレビ", {key: "tv", on: false}]);
    } catch (e) {}
    if (!on.length || !resting()) return;
    const dlg = el("dialog", "ui"),
      box = el("div", "offs");
    for (const [name, body] of on) {
      const b = el("button", "btn", `${name} を消す`);
      b.type = "button";
      b.onclick = async () => {
        b.disabled = true;
        try {
          const r = await fetch("api/ouchi", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
          if (!r.ok) throw 0;
          b.textContent = `${name} 消したよ`;
        } catch (e) {
          b.disabled = false;
          toast("消せませんでした");
        }
      };
      box.append(b);
    }
    const no = el("button", "ok", "これでいい");
    no.type = "button";
    no.onclick = () => dlg.close();
    const acts = el("div", "r");
    acts.append(no);
    acts.style.margin = "16px 0 0";
    dlg.append(el("div", "dh", "🌙 おやすみモードにしたよ"), el("div", "sub", "ついているもの。消すものがあれば押してね。"), box, acts);
    dlg.onclose = () => dlg.remove();
    document.body.append(dlg);
    dlg.showModal();
  }

  function paint() {
    const L = look(scope),
      k = theme === "dark" ? 0.62 : 1; // 暗いときは帯の色も少し沈める
    const rgb = [1, 3, 5].map(i => Math.round(parseInt((L.c || "#B84E33").slice(i, i + 2), 16) * k));
    const lum = rgb
      .map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      })
      .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const st = document.documentElement.style,
      bar = `rgb(${rgb.join(",")})`,
      lightBar = lum > 0.4;
    st.setProperty("--bar", bar);
    st.setProperty("--bar-ink", lightBar ? "#3A322D" : "#fff");
    st.setProperty("--bar-btn", lightBar ? "rgba(0,0,0,.1)" : "rgba(255,255,255,.18)");
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) {
      m = el("meta");
      m.name = "theme-color";
      document.head.append(m);
    }
    m.content = bar;
    const name = $("ttl");
    if (name) name.textContent = `${L.e} ${L.t}`;
    if (scope === "home") document.title = L.t;
  }

  function editLook(target) {
    const id = typeof target === "string" ? target : scope,
      L = look(id),
      dlg = el("dialog", "ui"),
      form = el("form");
    form.method = "dialog";
    let color = L.c;
    const e = el("input");
    e.value = L.e;
    e.maxLength = 16;
    e.setAttribute("aria-label", "絵文字");
    e.className = "em";
    const t = el("input");
    t.value = L.t;
    t.maxLength = 24;
    t.setAttribute("aria-label", "名前");
    const sw = el("div", "sw"),
      free = el("input");
    free.type = "color";
    free.value = color;
    free.title = "ほかの色";
    const mark = () => {
      for (const b of sw.querySelectorAll("button")) b.classList.toggle("on", b.dataset.c.toLowerCase() === color.toLowerCase());
    };
    for (const [name, c] of COLORS) {
      const b = el("button");
      b.type = "button";
      b.dataset.c = c;
      b.title = name;
      b.style.background = c;
      b.onclick = () => {
        color = c;
        free.value = c;
        mark();
      };
      sw.append(b);
    }
    free.oninput = () => {
      color = free.value;
      mark();
    };
    sw.append(free);
    mark();
    const row = el("div", "r");
    row.append(e, t);
    const ok = el("button", "ok", "これにする"),
      no = el("button", "no", "やめる");
    no.type = "button";
    no.onclick = () => dlg.close();
    const acts = el("div", "r");
    acts.append(no, ok);
    form.append(
      el("div", "dh", id === "home" ? "入口の 絵文字・名前・色" : `「${L.t}」の 絵文字・名前・色`),
      row,
      el(
        "div",
        "sub",
        id === "home" ? "色(ホーム画面に置いたときの、スマホの上の帯。名前は置いたときの名前と、入口に出ます)" : "アイコンと、上の帯の色",
      ),
      sw,
      acts,
    );
    form.onsubmit = async ev => {
      ev.preventDefault();
      if (!e.value.trim() || !t.value.trim()) return;
      try {
        const r = await fetch("api/ui", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({scope: id, e: e.value.trim(), t: t.value.trim(), c: color}),
        });
        if (!r.ok) throw 0;
        shell.ui = await r.json();
        paint();
        if (homeBox) tiles();
        if (onLook) onLook();
        dlg.close();
        toast("変えました");
      } catch (x) {
        toast("変えられませんでした");
      }
    };
    dlg.append(form);
    dlg.onclose = () => dlg.remove();
    document.body.append(dlg);
    dlg.showModal();
  }

  async function bar(pageId, title) {
    try {
      const [a, u] = await Promise.all([fetch("apps.json", {cache: "no-store"}), fetch("api/ui", {cache: "no-store"})]);
      shell = {apps: await a.json(), ui: await u.json()};
      peopleLook();
      shell.apps.push(...(shell.ui.sc || [])); // 📲 スマホのアプリのショートカット(入口の ⚙️ で足す。apps/appbtn.py)
    } catch (e) {}
    // 版ごとの はじめの値(ui.json の home.dflt)。その端末で まだ選んでいないときだけ使う: 字のフォント、住んでいる ようせいさんと色
    const dflt = shell.ui.home.dflt || {};
    if (!font && dflt.font) setFont(dflt.font, true);
    try {
      if (dflt.yousei && !localStorage.getItem(LS("gojiai-yousei-cfg"))) localStorage.setItem(LS("gojiai-yousei-cfg"), JSON.stringify(dflt.yousei));
    } catch (e) {}
    const app = pageId ? shell.apps.find(a => (a.pages || []).some(p => p.id === pageId)) : null;
    scope = app ? app.id : "home";
    if (app) opened(app.id); // 🕰️ ひらいた記録
    const head = el("header"),
      top = el("div", "top"),
      h1 = el("h1");
    // アプリの名前: 押すと そのアプリの まとめ(はじめのページ。apps.json の "home" があれば そこ)へ。長押しで 絵文字・名前・色を変える
    const name = el("button");
    name.id = "ttl";
    h1.append(name);
    if (app) {
      name.title = "押すと まとめへ・長押しで 絵文字・名前・色を変える";
      let lp = 0,
        long = false;
      name.addEventListener("pointerdown", () => {
        long = false;
        lp = setTimeout(() => {
          long = true;
          editLook();
        }, 600);
      });
      for (const ev of ["pointerup", "pointerleave", "pointercancel"]) name.addEventListener(ev, () => clearTimeout(lp));
      name.addEventListener("contextmenu", e => e.preventDefault());
      name.onclick = () => {
        if (!long) location.href = app.home || app.pages[0].u;
      };
    } else {
      name.title = "押すと、絵文字・名前・色を変えられます";
      name.onclick = () => editLook();
    }
    const back = el("a", null, "‹");
    back.href = "./";
    back.title = "アプリの一覧へ";
    back.className = "back";
    if (app) top.append(back, h1);
    else if (title) {
      h1.textContent = title;
      top.append(back, h1);
    } // せってい など、入口の仲間の画面
    else {
      // 入口は名前の帯を出さない(時計を出す)
      head.className = "bare";
      const me = el("a", null, "🏠");
      me.href = "/me";
      me.title = "入口へ";
      const set = el("a", null, "⚙️");
      set.href = "settei.html";
      set.title = "せってい(アプリ・背景・見た目)";
      const moon = el("button", null, "🌙");
      moon.id = "moon";
      moon.title = "おやすみモード(暗くして、アプリを減らす)";
      moon.onclick = () => setRest({on: !resting()});
      const yb = el("a", null, "💡");
      yb.href = "youbou.html";
      yb.title = "ようぼう(こうしてほしい を貼っておく)";
      ybNew(yb);
      top.append(
        el("span", "gap"),
        ...(shell.ui.youbou ? [yb] : []),
        moon,
        ...(shell.ui.nome ? [] : [me]),
        set,
      ); /* 💡 ようぼう も 設定で 入れた 版だけ(貼っても だれも 読まない 版では 出さない) */ // 🏠 は 持ち主の入口。ほかの人の版(nome)では出さない
    }
    head.append(top);
    if (app) {
      const tabs = el("div");
      tabs.id = "tabs";
      for (const p of app.pages) {
        const x = el("a", "tab" + (p.id === pageId ? " on" : ""), `${p.e} ${p.t}`);
        x.href = p.u;
        tabs.append(x);
      }
      head.append(tabWrap(tabs));
      setTimeout(() => {
        const on = tabs.querySelector(".on");
        if (on) on.scrollIntoView({inline: "center", block: "nearest"});
      });
    }
    document.body.prepend(head);
    const t = el("div");
    t.id = "toast";
    const hk = el("div");
    hk.id = "hanko";
    hk.innerHTML = '<div><span id="he">🌸</span>できた!</div>';
    document.body.append(t, hk);
    applyRest();
    paint();
  }

  // アプリの中の画面: G.start("画面の id", render)
  async function start(pageId, render) {
    onState = render;
    await bar(pageId);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) api("api/state").catch(() => {});
    });
    return api("api/state").catch(() => toast("つながりませんでした。Tailscale を見てください"));
  }

  // ---- 入口(アプリが四角く並ぶ画面): G.home(box)。並べないアプリと背景は ⚙️ から(ui.json の home.hidden・home.bg) ----
  const D0 = "#25201c";
  const WALLS = {
    // [名前, 明るいとき, 暗いとき]
    kinari: ["きなり", "#FBF4E8", D0],
    sakura: ["さくら", "linear-gradient(160deg,#FBD9D6,#FBF4E8 70%)", `linear-gradient(160deg,#4a2a2e,${D0} 70%)`],
    sora: ["そら", "linear-gradient(160deg,#CFE4F3,#FBF4E8 70%)", `linear-gradient(160deg,#1f3346,${D0} 70%)`],
    wakaba: ["わかば", "linear-gradient(160deg,#D3E8C8,#FBF4E8 70%)", `linear-gradient(160deg,#25382a,${D0} 70%)`],
    yuuyake: ["ゆうやけ", "linear-gradient(170deg,#F9D9B8,#F3BFC0 55%,#CDBDE6)", "linear-gradient(170deg,#4a3226,#3d2438 55%,#2a2644)"],
    yoake: ["よあけ", "linear-gradient(175deg,#C9D6F0,#F6D8CF 60%,#FBE9C6)", "linear-gradient(175deg,#1c2440,#3a2a3a 60%,#4a3a26)"],
    mizutama: [
      "みずたま",
      "radial-gradient(#E8D3B8 2px,transparent 2.2px) 0 0/20px 20px,#FBF4E8",
      `radial-gradient(#3f362f 2px,transparent 2.2px) 0 0/20px 20px,${D0}`,
    ],
    koushi: [
      "こうし",
      "linear-gradient(#EFE0C9 1px,transparent 1px) 0 0/22px 22px,linear-gradient(90deg,#EFE0C9 1px,transparent 1px) 0 0/22px 22px,#FBF4E8",
      `linear-gradient(#3a322c 1px,transparent 1px) 0 0/22px 22px,linear-gradient(90deg,#3a322c 1px,transparent 1px) 0 0/22px 22px,${D0}`,
    ],
  };
  let homeBox = null,
    onLook = null;
  const wallCss = bg =>
    bg === "photo"
      ? `url(wall.jpg?v=${shell.ui.home.wallv || 0}) center/cover no-repeat`
      : bg && bg[0] === "#"
        ? bg
        : (WALLS[bg] || WALLS.kinari)[theme === "dark" ? 2 : 1];

  function wallInk(bg) {
    // 背景の上の字の色 [濃い字, うすい字]。きまった柄は紙の色のまま(null)
    if (bg === "photo") return ["#fff", "rgba(255,255,255,.85)"];
    if (bg[0] !== "#") return [null, null];
    const lum = [1, 3, 5].map(i => parseInt(bg.slice(i, i + 2), 16) / 255).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    return lum > 0.5 ? ["#3A322D", "#6E625A"] : ["#F3EADB", "#D8CABA"];
  }

  function wall(bg) {
    // 入口だけに敷く。写真のときは白い字に影、好きな色のときは明るさに合わせた字
    if (!homeBox) return;
    bg = bg || shell.ui.home.bg || "yoake"; /* まだ えらんで いなければ よあけ */
    const st = document.body.style;
    st.setProperty("--wall", wallCss(bg));
    document.body.classList.toggle("photo", bg === "photo");
    for (const v of ["--ink", "--sub", "--mute", "--line"]) st.removeProperty(v);
    let [ink, soft] = wallInk(bg);
    if (homeInk) {
      ink = homeInk;
      soft = `color-mix(in srgb,${homeInk} 78%,transparent)`;
    } // 自分で選んだ字の色
    // 窓(dialog)の中は紙の色のままにしたいので、字の色は入口の中身にだけ付ける
    for (const box of document.querySelectorAll("main, header.bare"))
      for (const v of ["--ink", "--sub", "--mute", "--line"])
        ink ? box.style.setProperty(v, v === "--ink" ? ink : soft) : box.style.removeProperty(v);
  }

  // 写真を長い辺 1600px までに小さくして JPEG で送る
  async function sendPhoto(file) {
    const img = await createImageBitmap(file),
      k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.width * k);
    cv.height = Math.round(img.height * k);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.85));
    const r = await fetch("api/wall", {method: "POST", headers: {"Content-Type": "image/jpeg"}, body: blob});
    if (!r.ok) throw new Error(r.status);
    shell.ui = await r.json();
  }

  // 並び順は ui.json の home.order(id の列)。そこに無いアプリは、apps.json の順で後ろに並ぶ
  function ordered() {
    const o = shell.ui.home.order || [],
      at = id => {
        const i = o.indexOf(id);
        return i < 0 ? 1e6 : i;
      };
    return shell.apps
      .map((a, i) => [a, i])
      .sort((x, y) => at(x[0].id) - at(y[0].id) || x[1] - y[1])
      .map(x => x[0]);
  }

  // 入口の しるし: apps.json に "dot": "口"(相手が最後に書いた時刻 {"at"} を返す)があるアプリは、まだ見ていなければ 四角の角に小さな点。数は出さない
  // アプリの画面で G.seen(id, 時刻) と「見た」を覚える(端末ごと)。G.seen(id) は前に覚えた時刻を返す
  function seen(id, at) {
    const k = LS("gojiai-seen-" + id);
    let old = null;
    try {
      old = localStorage.getItem(k);
      if (at) localStorage.setItem(k, at);
    } catch (e) {}
    return old;
  }
  // 口に since(前に見た時刻)を付けて聞く。返事に "e"(絵 1 つ)があれば 点のかわりに その絵を小さく出す(ホワイトボードなら 🗑️ か 🛒)
  async function dot(a, ic) {
    try {
      const s = seen(a.id) || "",
        j = await (await fetch(a.dot + (a.dot.includes("?") ? "&" : "?") + "since=" + encodeURIComponent(s), {cache: "no-store"})).json();
      if (j.at && j.at > s) ic.append(el("i", "dot" + (j.e ? " e" : ""), j.e || null));
    } catch (e) {}
  }

  // 📲 ショートカットの行き先: iPhone はアプリの合図、Android は intent:(入っていなければ Google Play へ)
  function scHref([ios, pkg]) {
    if (!/Android/.test(navigator.userAgent)) return ios;
    return `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=${pkg};S.browser_fallback_url=${encodeURIComponent("https://play.google.com/store/apps/details?id=" + pkg)};end`;
  }

  // タブの列が横にはみ出すとき: 続きがある側をうすく消して ‹ › を出す(押すと そちらへ送る)
  function tabWrap(tabs) {
    const w = el("div", "tabw"),
      l = el("button", "tabar l", "‹"),
      r = el("button", "tabar r", "›");
    l.setAttribute("aria-label", "前のタブ");
    r.setAttribute("aria-label", "次のタブ");
    l.onclick = () => tabs.scrollBy({left: -tabs.clientWidth * 0.7, behavior: "smooth"});
    r.onclick = () => tabs.scrollBy({left: tabs.clientWidth * 0.7, behavior: "smooth"});
    const f = () => {
      w.classList.toggle("ml", tabs.scrollLeft > 4);
      w.classList.toggle("mr", tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 4);
    };
    tabs.addEventListener("scroll", f, {passive: true});
    addEventListener("resize", f);
    new MutationObserver(f).observe(tabs, {childList: true, subtree: true, attributes: true});
    requestAnimationFrame(f);
    w.append(tabs, l, r);
    return w;
  }

  // 決めていなければ 版ごとの はじめの値(ui.json の home.dflt.lparr。もう ひとりの版は true、持ち主の版は なし = しない)
  const lpOn = () => {
    let v = null;
    try {
      v = localStorage.getItem(LS("gojiai-lparr"));
    } catch (e) {}
    return v === null ? !!(shell.ui.home.dflt || {}).lparr : v === "1";
  };

  // 🕰️ ひらいた記録(この端末だけ): {id: {last: ms, days: {"YYYY-MM-DD": 回数}}}。14 日ぶん
  // ⚙️ で えらぶと、開いたアプリの四角は うすくなって、時間がたつと もとの こさに もどる(何度も開かなくていいように)
  const OKEY = () => LS("gojiai-opens");
  const opensGet = () => {
    try {
      return JSON.parse(localStorage.getItem(OKEY())) || {};
    } catch (e) {
      return {};
    }
  };
  const dayKey = t => {
    const d = new Date(t - 4 * 3600e3);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  function opened(id) {
    const o = opensGet(),
      now = Date.now(),
      k = dayKey(now),
      x = o[id] || {days: {}};
    if (x.last && now - x.last < 60e3) return; // 1 分のうちの 開き直し・タブの行き来は 1 回
    x.last = now;
    x.days[k] = (x.days[k] || 0) + 1;
    const old = dayKey(now - 14 * 864e5);
    for (const d of Object.keys(x.days)) if (d < old) delete x.days[d];
    o[id] = x;
    try {
      localStorage.setItem(OKEY(), JSON.stringify(o));
    } catch (e) {}
  }
  const FADE_DFLT = 180; /* 開いた アプリを うすく して おく 時間の はじめの 値(分)= 3 時間 */
  const fadeMin = () => {
    try {
      const raw = localStorage.getItem(LS("gojiai-fade"));
      if (raw === null) return FADE_DFLT; /* まだ えらんで いなければ はじめの 値 */
      const v = Number(raw);
      return v > 0 ? v : 0;
    } catch (e) {
      return 0;
    }
  }; // 0 = しない
  // アプリごとの時間(分。0 = しない)。無いアプリは 全体の時間(fadeMin)
  const fadeApp = () => {
    try {
      return JSON.parse(localStorage.getItem(LS("gojiai-fade-app"))) || {};
    } catch (e) {
      return {};
    }
  };
  const fadeOf = id => {
    const f = fadeApp();
    return id in f ? f[id] : fadeMin();
  };
  function fadeTiles() {
    if (!homeBox) return;
    const o = opensGet(),
      now = Date.now();
    for (const t of homeBox.querySelectorAll(".app[data-id]")) {
      const m = fadeOf(t.dataset.id),
        x = o[t.dataset.id],
        k = m && x && x.last ? Math.min(1, (now - x.last) / (m * 60e3)) : 1;
      t.style.opacity = k >= 1 ? "" : String(0.3 + 0.7 * k);
    }
  }
  setInterval(fadeTiles, 60e3);

  function tiles() {
    const hidden = new Set(shell.ui.home.hidden || []);
    homeBox.textContent = "";
    const rest = resting(),
      keep = new Set((shell.ui.rest || {}).keep || []);
    for (const a of ordered()) {
      if (hidden.has(a.id) || (rest && !keep.has(a.id))) continue;
      const L = look(a.id),
        tile = el(a.soon ? "button" : "a", "app" + (a.soon ? " soon" : "")),
        ic = el("span", "ic", L.e);
      ic.style.background = L.c || "#B84E33";
      ic.style.setProperty("--c", L.c || "#B84E33");
      if (a.soon) tile.onclick = () => toast(`「${L.t}」はこれから作ります`);
      else tile.href = a.sc ? scHref(a.sc) : a.u || a.pages[0].u;
      if (a.u && /^https?:/.test(a.u)) tile.rel = "noopener";
      tile.dataset.id = a.id;
      tile.draggable = false;
      tile.append(ic, el("span", "nm", L.t));
      homeBox.append(tile);
      if (a.sc || (a.u && /^https?:/.test(a.u)))
        tile.addEventListener("click", () => {
          if (!document.body.classList.contains("arrange")) {
            opened(a.id);
            setTimeout(fadeTiles, 300);
          }
        }); // ほかのアプリ・サイトへ出るものは 押したときに
      if (a.dot && !a.soon) dot(a, ic);
    }
    if (document.body.classList.contains("arrange")) {
      // 並べかえのときは あいているところに ＋(しまったアプリ・スマホのアプリを出す)
      const p = el("button", "app addt"),
        ic = el("span", "ic", "＋");
      p.type = "button";
      p.onclick = () => addApp();
      p.append(ic, el("span", "nm", "アプリを出す"));
      homeBox.append(p);
    } else if (!homeBox.children.length) homeBox.append(el("div", "empty", "ぜんぶ しまってあります。⚙️ から出せます。"));
    if (!document.body.classList.contains("arrange")) fadeTiles();
  }

  // 並べかえ: ⚙️ →「↔ アプリを動かす」。四角を指でつまんで動かし、下の「できた」で覚える
  function arrange() {
    if (document.body.classList.contains("arrange")) return;
    document.body.classList.add("arrange");
    let drag = null;
    const stop = ev => {
      if (ev.type === "click" && ev.target.closest(".addt")) return;
      ev.preventDefault();
      ev.stopPropagation();
    }; // ＋ の四角は押せる
    const down = ev => {
      const t = ev.target.closest(".app");
      if (!t || t.classList.contains("addt")) return;
      drag = t;
      t.classList.add("drag");
      try {
        homeBox.setPointerCapture(ev.pointerId);
      } catch (e) {}
      ev.preventDefault();
    };
    const move = ev => {
      if (!drag) return;
      const hit = document.elementFromPoint(ev.clientX, ev.clientY),
        o = hit && hit.closest(".app");
      if (!o || o === drag || o.parentNode !== homeBox) return;
      homeBox.insertBefore(drag, drag.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING ? o.nextSibling : o);
    };
    const up = () => {
      if (drag) drag.classList.remove("drag");
      drag = null;
    };
    const evs = [
      ["click", stop, true],
      ["contextmenu", stop, true],
      ["pointerdown", down],
      ["pointermove", move],
      ["pointerup", up],
      ["pointercancel", up],
    ];
    for (const [n, f, c] of evs) homeBox.addEventListener(n, f, c);
    const done = el("button", "arr-done", "✓ できた");
    done.onclick = async () => {
      const shown = [...homeBox.querySelectorAll(".app:not(.addt)")].map(t => t.dataset.id);
      const order = [
        ...shown,
        ...ordered()
          .map(a => a.id)
          .filter(id => !shown.includes(id)),
      ]; // しまってあるものは後ろへ
      for (const [n, f, c] of evs) homeBox.removeEventListener(n, f, c);
      document.body.classList.remove("arrange");
      done.remove();
      try {
        const r = await fetch("api/order", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({order})});
        if (!r.ok) throw 0;
        shell.ui = await r.json();
        toast("並び順を覚えました");
      } catch (x) {
        toast("覚えられませんでした");
      }
      tiles();
    };
    // ＋ アプリを出す: 並びの あいているところ(いちばん後ろ)に ＋ の四角(tiles() が付ける)
    tiles();
    document.body.append(done);
    toast("四角をつまんで動かしてね");
  }
  async function addApp() {
    const dlg = el("dialog", "ui"),
      list = el("div", "apps"),
      hid = shell.apps.filter(a => (shell.ui.home.hidden || []).includes(a.id));
    let sc = null;
    try {
      sc = await (await fetch("api/appbtn", {cache: "no-store"})).json();
    } catch (e) {}
    const rows = [
      ...hid.map(a => ({k: "g", id: a.id, e: look(a.id).e, t: look(a.id).t})),
      ...(sc ? sc.catalog.filter(c => !sc.on.includes(c[0])).map(c => ({k: "sc", id: c[0], e: c[1], t: c[2]})) : []),
    ];
    if (!rows.length) list.append(el("div", "empty", "しまってある アプリは ありません。"));
    let h = null;
    for (const r of rows) {
      const g = r.k === "g" ? "しまってある アプリ" : "📲 スマホアプリ";
      if (g !== h) {
        h = g;
        list.append(el("div", "sub", g));
      }
      const b = el("button", "pick", `${r.e} ${r.t}`);
      b.type = "button";
      b.onclick = async () => {
        b.disabled = true;
        try {
          if (r.k === "g") {
            const hidden = (shell.ui.home.hidden || []).filter(x => x !== r.id);
            const x = await fetch("api/home", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({hidden, bg: shell.ui.home.bg || "yoake"}),
            });
            if (!x.ok) throw 0;
            shell.ui = await x.json();
          } else {
            const x = await fetch("api/appbtn", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({on: [...sc.on, r.id]}),
            });
            if (!x.ok) throw 0;
            const j = await x.json();
            sc.on = j.on;
            shell.apps = shell.apps.filter(a => !String(a.id).startsWith("sc-")).concat(j.sc);
            shell.ui.sc = j.sc;
          }
          dlg.close();
          tiles();
          toast(`${r.t} を出しました。動かして「できた」で 覚えます`);
        } catch (e) {
          b.disabled = false;
          toast("出せませんでした");
        }
      };
      list.append(b);
    }
    // 🌐 サイトのショートカット(Chrome の「ホーム画面に追加」のようなもの): アドレスを貼って足す
    const web = el("button", "pick", "🌐 サイトのショートカットを足す…");
    web.type = "button";
    web.onclick = () => {
      list.textContent = "";
      const u = el("input");
      u.type = "url";
      u.placeholder = "https://…(アドレス)";
      u.style.cssText = "width:100%;font-size:16px";
      const e = el("input");
      e.value = "🌐";
      e.maxLength = 16;
      e.className = "em";
      const t = el("input");
      t.placeholder = "名前(なくてもいい)";
      t.maxLength = 24;
      t.style.fontSize = "16px";
      const row = el("div", "r");
      row.append(e, t);
      const ok = el("button", "ok", "足す");
      ok.type = "button";
      ok.onclick = async () => {
        if (!u.value.trim()) return u.focus();
        ok.disabled = true;
        try {
          const x = await fetch("api/appbtn", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({add_web: {u: u.value.trim(), t: t.value.trim(), e: e.value.trim()}}),
          });
          if (!x.ok) throw 0;
          const j = await x.json();
          shell.apps = shell.apps.filter(a => !String(a.id).startsWith("sc-")).concat(j.sc);
          shell.ui.sc = j.sc;
          dlg.close();
          tiles();
          toast("入口に足しました。動かして「できた」で 覚えます");
        } catch (x) {
          ok.disabled = false;
          toast("そのアドレスでは足せませんでした");
        }
      };
      list.append(el("div", "sub", "Chrome でそのページを開いて、アドレスを長押しで写して 貼りつけてください。"), u, row, ok);
      u.focus();
    };
    list.prepend(web);
    const no = el("button", "no", "とじる"),
      acts = el("div", "r");
    no.type = "button";
    no.onclick = () => dlg.close();
    acts.append(no);
    dlg.append(el("div", "dh", "＋ アプリを出す"), list, acts);
    dlg.onclose = () => dlg.remove();
    document.body.append(dlg);
    dlg.showModal();
  }

  async function home(box) {
    await bar(null);
    homeBox = box;
    wall();
    tiles();
    document.body.classList.toggle("notalk", shell.ui.home.talk === false); // 💬 はなしかける を出さない(⚙️ 入口)
    if (location.hash === "#arrange") {
      history.replaceState(null, "", "./");
      arrange();
    } // せってい →「並び順を変える」から来たとき
    // ⚙️ で えらんだら: 何もないところ(四角・ボタン・ウィジェット・はなしかける の外)を 0.6 秒 長押しで 並べかえ
    {
      let t = null,
        x0 = 0,
        y0 = 0;
      const stop = () => {
        clearTimeout(t);
        t = null;
      };
      document.addEventListener("pointerdown", ev => {
        if (!lpOn() || document.body.classList.contains("arrange")) return;
        if (ev.target.closest(".app, a, button, input, textarea, select, dialog, .gw, .talk, header, #hf")) return;
        x0 = ev.clientX;
        y0 = ev.clientY;
        stop();
        t = setTimeout(() => {
          t = null;
          if (navigator.vibrate) navigator.vibrate(15);
          arrange();
        }, 600);
      });
      document.addEventListener("pointermove", ev => {
        if (t && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10) stop();
      });
      for (const n of ["pointerup", "pointercancel", "scroll"]) document.addEventListener(n, stop, true);
    }
    const ck = $("clock");
    if (!ck) return;
    const line = el("button", "restline");
    line.id = "restline";
    line.hidden = true;
    line.onclick = () => setRest({on: false});
    ck.after(line);
    applyRest();
    const again = async () => {
      // 夜になったら自動で入る・朝に出るのを、開いたままでも拾う
      try {
        const u = await (await fetch("api/ui", {cache: "no-store"})).json(),
          was = resting();
        shell.ui = u;
        if (was !== resting()) {
          applyRest();
          paint();
          wall();
          tiles();
        } else applyRest();
      } catch (e) {}
    };
    setInterval(again, 300000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) again();
    });
    if (ysWanted()) liveYousei().catch(() => {});
    const tick = () => {
      const d = new Date();
      ck.textContent = "";
      const dt = el("div", "dt", `${d.getMonth() + 1}月${d.getDate()}日(${"日月火水木金土"[d.getDay()]})`);
      // ⏰ 日付の横(夜 20 時〜朝 4 時だけ。朝は出さない)。23 時からは 金色で光る「あしたの アラーム、かけた?」。
      // 押すと スマホの 時計アプリ(Play ストアを通ることがある)。ひらいたら その夜は うすく(端末ごと)
      const h = d.getHours();
      if (/Android/.test(navigator.userAgent) && (h >= 20 || h < 4)) {
        const n = new Date(d);
        if (h < 4) n.setDate(n.getDate() - 1);
        const key = `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`;
        let done = false;
        try {
          done = localStorage.getItem(LS("gojiai-alarm")) === key;
        } catch (e) {}
        const al = el("a", "alarm" + (done ? " done" : h >= 23 || h < 4 ? " late" : ""), "⏰");
        // Google の「時計」を名指しで。Chrome が通さないときは Play ストアの そのページ(「開く」で時計)へ
        al.href =
          "intent:#Intent;action=android.intent.action.SHOW_ALARMS;package=com.google.android.deskclock;S.browser_fallback_url=" +
          encodeURIComponent("https://play.google.com/store/apps/details?id=com.google.android.deskclock") +
          ";end";
        al.title = al.ariaLabel = done ? "アラーム、見たよ" : "あしたの アラーム、かけた?(押すと うすくなる)";
        al.onclick = () => {
          try {
            localStorage.setItem(LS("gojiai-alarm"), key);
          } catch (e) {}
          setTimeout(tick, 500);
        }; // ひらいたら その夜は うすく
        dt.append(al);
      }
      ck.append(el("div", "tm", `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`), dt);
    };
    tick();
    setInterval(tick, 5000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tick();
    });
  }

  // いまいるところの一言。寒さ → まわりとの差 → 乾き → 空気 の順に、1つだけ言う
  function hint(env) {
    const h = env.here,
      same = h && h.room ? env.spots.filter(s => s.room === h.room && s.temp < h.temp - 3) : [];
    if (!h || h.temp == null) return h ? `${h.label}には温度計がまだないよ。` : "";
    if (h.out)
      return h.temp < 10 ? "外はかなり冷えるね。首と手をあたためて。" : h.temp < 16 ? "外は肌寒いよ。1枚はおって。" : "外はそんなに寒くないよ。";
    if (h.temp < 19) return "ちょっと寒いね。あったかくしよう。";
    if (same.length) return `${same[0].spot || "ほかの場所"}は ${same[0].temp.toFixed(1)}℃。そこに行くと冷えるよ。`;
    if (h.hum != null && h.hum < 35) return "空気がかわいてる。のみものをどうぞ。";
    if ((env.eco2 || 0) > 1000) return "空気がこもってるみたい。窓を少しあけよう。";
    return "ここはあったかいよ。";
  }

  const sub = title => bar(null, title); // 入口の仲間の画面(💡 ようぼう など): 名前の帯だけ
  // 💡 ようぼう: ようぼう(貼った・OK・できた)か 🧪 ベータ に、前に開いたあと 変わったものがあれば ボタンの地を こく(youbou.html が G.ybMark で 見たことにする)
  const ybSig = async () => {
    const [y, h] = await Promise.all([
      fetch("api/youbou", {cache: "no-store"}).then(r => r.json()),
      fetch("youbou.html", {cache: "no-store"}).then(r => r.text()),
    ]);
    const at =
      (y.youbou || [])
        .flatMap(x => [x.ts, x.ok, x.done])
        .filter(Boolean)
        .sort()
        .pop() || "";
    const beta = ((h.match(/const BETA = \[([\s\S]*?)\n\];/) || [])[1] || "").match(/\[\s*"[^"]*",\s*"([^"]+)"/g) || [];
    return {yb: at, beta: beta.join("|").length + ":" + beta.map(s => s.slice(-6)).join("")};
  };
  async function ybNew(btn) {
    try {
      const s = await ybSig();
      if (s.yb > (seen("youbou") || "") || (seen("beta") || "") !== s.beta) btn.classList.add("new");
    } catch (e) {}
  }
  async function ybMark() {
    try {
      const s = await ybSig();
      seen("youbou", s.yb || "0");
      seen("beta", s.beta);
    } catch (e) {}
  }

  // ---- どのアプリでも同じにする部品(.claude/skills/gojiai-app/SKILL.md の決まり) ----

  // 入力: スマホで キーボードが出たら、いま書いている欄が 見えるところまで ずらす(どのページでも)
  if (window.visualViewport) {
    let lastH = visualViewport.height;
    visualViewport.addEventListener("resize", () => {
      const a = document.activeElement,
        shrink = visualViewport.height < lastH - 80;
      lastH = visualViewport.height;
      if (shrink && a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) setTimeout(() => a.scrollIntoView({block: "center", behavior: "smooth"}), 60);
    });
  }

  // G.gear(): ⚙️ せってい(ページの id が「…-settei」)を タブの列から 上の帯の右へ。ほかの帯のボタンと同じ大きさ。
  // せっていの中では 輪が付き、もう一度押すと 来たページへ(アプリの外から来たら まとめへ)。opts.hideTabs で タブの列ごと しまう
  function gear(opts = {}, n = 0) {
    const tabs = document.querySelector("header #tabs"),
      bar = document.querySelector("header .top");
    if (!tabs || !bar) {
      if (n < 600) requestAnimationFrame(() => gear(opts, n + 1));
      return;
    }
    const app = shell.apps.find(a => a.id === scope) || {pages: []};
    const sp = app.pages.find(p => /-settei$/.test(p.id));
    if (!sp) return;
    const a = [...tabs.querySelectorAll("a")].find(x => x.getAttribute("href") === sp.u);
    if (!a) return;
    a.className = "gear";
    a.textContent = "⚙️";
    a.title = "せってい";
    a.setAttribute("aria-label", "せってい");
    if (location.pathname.endsWith("/" + sp.u) || location.pathname.endsWith(sp.u)) {
      a.classList.add("on");
      a.title = "せっていを とじる";
      let back = app.home || app.pages[0].u;
      try {
        const r = new URL(document.referrer);
        const f = r.pathname.split("/").pop() + r.search;
        if (r.origin === location.origin && app.pages.some(p => p.u.split("?")[0] === r.pathname.split("/").pop() && p.u !== sp.u)) back = f;
      } catch (e) {}
      a.href = back;
    }
    bar.insertBefore(a, bar.querySelector("h1").nextSibling);
    if (opts.hideTabs) {
      const w = tabs.closest(".tabw") || tabs;
      w.style.display = "none";
    }
  }

  // G.slide(box, sel, done): 行を 長押し(0.4 秒)で つまんで 上下にスライドして 並べかえ。はなすと done([行…]) 。ボタン・入力の上からは つまめない
  function slide(box, sel, done) {
    for (const row of box.querySelectorAll(sel)) {
      if (row._slide) continue;
      row._slide = true;
      let timer = 0,
        y0 = 0,
        on = false,
        sy = 0;
      const begin = () => {
        on = true;
        y0 = sy;
        row.classList.add("dragging");
        if (navigator.vibrate) navigator.vibrate(15);
      };
      const move = y => {
        const dy = y - y0,
          prev = row.previousElementSibling,
          next = row.nextElementSibling;
        if (prev && prev.matches(sel) && dy < -prev.offsetHeight / 2) {
          box.insertBefore(row, prev);
          y0 -= prev.offsetHeight;
        } else if (next && next.matches(sel) && dy > next.offsetHeight / 2) {
          box.insertBefore(next, row);
          y0 += next.offsetHeight;
        }
        row.style.transform = `translateY(${y - y0}px)`;
      };
      let moved = false; // つまんで はなしたときの click(チェックが切りかわる など)は 捨てる
      row.addEventListener(
        "click",
        e => {
          if (moved) {
            moved = false;
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true,
      );
      const end = () => {
        clearTimeout(timer);
        timer = 0;
        if (!on) return;
        on = false;
        moved = true;
        setTimeout(() => {
          moved = false;
        }, 400);
        row.classList.remove("dragging");
        row.style.transform = "";
        done([...box.querySelectorAll(sel)]);
      };
      const down = (y, t) => {
        if (t.closest("button,input,select,textarea,a")) return;
        sy = y;
        timer = setTimeout(begin, 400);
      };
      row.addEventListener("touchstart", e => down(e.touches[0].clientY, e.target), {passive: true});
      row.addEventListener(
        "touchmove",
        e => {
          const y = e.touches[0].clientY;
          if (on) {
            e.preventDefault();
            move(y);
          } else if (Math.abs(y - sy) > 8) clearTimeout(timer);
        },
        {passive: false},
      );
      row.addEventListener("touchend", end);
      row.addEventListener("touchcancel", end);
      row.addEventListener("mousedown", e => down(e.clientY, e.target));
      addEventListener("mousemove", e => {
        if (on) move(e.clientY);
        else if (timer && Math.abs(e.clientY - sy) > 8) clearTimeout(timer);
      });
      addEventListener("mouseup", end);
      row.addEventListener("contextmenu", e => {
        if (on || timer) e.preventDefault();
      });
    }
  }

  /* ⚙️ の「つなぎ方」の 写す 箱: <div class="cp" data-u="api/…">(スマホから 届く アドレスを 頭に 付ける)か data-t="そのままの 文字"。
     アドレスの 頭は いま 開いて いる 場所(Tailscale の 名前が そのまま 入る)。PC の localhost で 開いた ときは api/ui の base(config.json) */
  async function how() {
    let base = location.href.replace(/[^/]*$/, "");
    if (!/\.ts\.net$/.test(location.hostname)) {
      try {
        const u = await (await fetch("api/ui")).json();
        if (u.base) base = u.base;
      } catch (e) {}
    }
    const copy = async t => {
      try {
        await navigator.clipboard.writeText(t);
        return true;
      } catch (e) {}
      const ta = el("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {}
      ta.remove();
      return ok;
    };
    if (location.hash === "#how") {
      const h = document.getElementById("how");
      if (h) {
        h.open = true;
        setTimeout(() => h.scrollIntoView({block: "start"}), 300);
      }
    } /* 🔗 れんけい の「設定へ」から 来た とき */
    for (const box of document.querySelectorAll(".how .cp:empty")) {
      const t = box.dataset.t || base + (box.dataset.u || ""),
        b = el("button", null, "写す");
      b.type = "button";
      b.onclick = async () => toast((await copy(t)) ? "写しました。貼りつけてね" : "写せませんでした。「表示」で 出して 長押しで えらんでね");
      /* アドレスは ふだん かくす(Tailscale の 名前が 入る)。👁 表示 / かくす で 出し入れ。写す は かくした ままでも できる */
      const c = el("code", "hid", "アドレスは かくして います"),
        eye = el("button", "eye", "表示");
      eye.type = "button";
      eye.onclick = () => {
        const on = c.classList.toggle("hid");
        c.textContent = on ? "アドレスは かくして います" : t;
        eye.textContent = on ? "表示" : "かくす";
      };
      box.append(c, eye, b);
    }
  }
  /* 👪 かぞく(⚙️ せってい)で えらんだ 色を、板・冷蔵庫・食品 などの「だれの」の 色(--st-ari・--st-kazeo)に する。
     えらんで いなければ 各ページの はじめの 色の まま。ひとりで 使う なら body.solo(「だれの」を えらぶ 部品を しまう) */
  function peopleLook() {
    const pp = shell.ui.pp;
    if (!pp) return;
    document.body.classList.toggle("solo", !!pp.solo);
    const rule = i => ["ari", "kazeo"].map(k => (pp[k] && pp[k].col ? `--st-${k}:${pp[k].col[i]};` : "")).join("");
    let st = document.getElementById("pp-colors");
    if (!st) {
      st = el("style");
      st.id = "pp-colors";
      document.head.append(st);
    }
    st.textContent = `:root:root{${rule(0)}}:root:root[data-theme=dark]{${rule(1)}}`;
  }
  /* まだ つないで いない とき の 案内。
     G.needLink({e: "🫧", t: "まだ つないで いません。", sub: "…", href: "karada-settei.html#how"}) → 枠 1 つ(絵・ひとこと・説明・「つなぎ方を 見る」)を 返す */
  function needLink({e = "🔗", t = "まだ つないで いません。", sub = "", href = "", go = "つなぎ方を 見る"} = {}) {
    const b = el("div", "box needlink");
    b.append(el("div", "e", e), el("div", "t", t));
    if (sub) b.append(el("div", "sub", sub));
    if (href) {
      const a = el("a", "go", go);
      a.href = href;
      b.append(a);
    }
    return b;
  }
  /* ⚙️ せってい の 画面(web/settei.js)に 貸す 部品。変わって いく 値は その ときの 値を 返す */
  const _in = {
    peopleLook,
    FONTS,
    LS,
    WALLS,
    bar,
    canFull,
    dayKey,
    editLook,
    el,
    fadeApp,
    fadeMin,
    fontLink,
    fontUrl,
    look,
    lpOn,
    needYousei,
    opensGet,
    ordered,
    sendPhoto,
    setFont,
    setFull,
    setInk,
    setMode,
    setPuru,
    setRest,
    setTsuya,
    tabWrap,
    toast,
    wallCss,
    wallInk,
    get font() {
      return font;
    },
    get full() {
      return full;
    },
    get homeInk() {
      return homeInk;
    },
    get mode() {
      return mode;
    },
    get onLook() {
      return onLook;
    },
    set onLook(v) {
      onLook = v;
    },
    get puru() {
      return puru;
    },
    get shell() {
      return shell;
    },
    get theme() {
      return theme;
    },
    get tsuya() {
      return tsuya;
    },
  };
  return {
    needLink,
    how,
    sub,
    $,
    el,
    KIND,
    band,
    api,
    stamp,
    toast,
    start,
    home,
    _in,
    hint,
    seen,
    gear,
    slide,
    ybMark,
    get S() {
      return S;
    },
    get ui() {
      return shell.ui;
    },
    get owner() {
      return shell.ui.owner || "わたし";
    },
    get people() {
      return {ari: "わたし", kazeo: "あいて", ...(shell.ui.people || {})};
    },
    get rest() {
      return resting();
    },
  };
})();

// つながらないときに「Tailscale をつないでね」の画面を出す(sw.js)。覚えるのは offline.html だけ
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
