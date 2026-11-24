// ぬくまど(ごじあい の 体験版): サーバーの かわりに ブラウザの 中で 答える。tools/build_lite.py が 各 ページの common.js の 前に 差しこむ。
// window.fetch と XMLHttpRequest を 包んで、相対の api/… と apps.json への 要求に ここで 答える(Response を 返す)。答えの 形は 本物の サーバーと 同じ。
// 写した もと: server.py(ui・state・stamp・unstamp・cards・home・order・ui・rest)・apps/tut.py・root.py・oyasumi.py・appbtn.py・hitoiki.py・bgm.py・kv.py
// 記録は この ブラウザの localStorage だけ(キーは nukumado: で 始まる)。外へは 何も 送らない・取りに 行かない。1 日の 区切りは 朝 4 時。
// はじめの カードと アプリの 一覧は lite/defaults.js(build_lite.py が apps/cards_default.json と web/apps.json から 作る)の self.LITE_DEFAULTS。
(() => {
  const DEF = self.LITE_DEFAULTS || {cards: [], apps: []};
  const BASE = new URL("../", document.currentScript ? document.currentScript.src : location.href).pathname;
  const page = location.pathname.slice(BASE.length).replace(/\.html$/, "") || "index";
  document.documentElement.dataset.lite = page;

  // ---- 置き場所(localStorage。使えない ときは この ページの 間だけ 覚える) ----
  const P = "nukumado:";
  const mem = {};
  let LS = null;
  try {
    LS = window.localStorage;
    LS.length;
  } catch (e) {
    LS = null;
  }
  /* common.js が あとで setItem を 包む(api/kv へ 送る)ので、もとの ものを 先に 取って おく */
  const set0 = Storage.prototype.setItem;
  const get = (k, d) => {
    try {
      const v = LS ? LS.getItem(P + k) : mem[k];
      return v == null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  };
  const put = (k, v) => {
    const s = JSON.stringify(v);
    try {
      if (LS) set0.call(LS, P + k, s);
      else mem[k] = s;
    } catch (e) {
      mem[k] = s;
    }
  };
  /* おえた あとの「つなぐと 使える アプリは 🔗 れんけい から」は 体験版には 無い */
  try {
    sessionStorage.removeItem("gojiai-tut-done");
  } catch (e) {}
  /* 入口の ウィジェットは 🔗 ショートカット だけ(天気・予定・やること・電気・予定を足す は 体験版に 無い) */
  try {
    const wk = "gw-items:" + location.pathname.replace(/[^/]*$/, "");
    if (LS && LS.getItem(wk) === null) set0.call(LS, wk, JSON.stringify(["sc"]));
  } catch (e) {}

  // ---- 小さな 道具 ----
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const iso = d => `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const dayOf = d => ymd(new Date(d.getTime() - 4 * 3600e3));
  const cut = (s, n) => Array.from(s).slice(0, n).join("");
  /* server.py の clean: 1 行の 文字に(改行を 空白に・前後の 空白を 取って n 字まで) */
  const clean = (s, n) =>
    cut(
      String(s || "")
        .replace(/\n/g, " ")
        .trim(),
      n,
    );
  const hex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, "0")).join("");
  const isDict = v => !!v && typeof v === "object" && !Array.isArray(v);
  const isInt = v => Number.isInteger(v);
  const ID = /^[a-z0-9_-]+$/;
  const E = (body, status = 400) => [body, status];

  // ---- root.py: 呼び名・👪 かぞく ----
  const PALETTE = {
    murasaki: ["#dcd0f2", "#bfb0de"],
    momo: ["#fad4de", "#e0b3c0"],
    sora: ["#cfe4f7", "#a9c6e0"],
    mizu: ["#cdeee6", "#a3d4c8"],
    wakaba: ["#d9edc6", "#b7d49e"],
    kiiro: ["#f8e9b0", "#dcc98a"],
    daidai: ["#fbd9bd", "#e0b896"],
    hai: ["#e3ddd6", "#c4bcb2"],
  };
  const uiFile = () => {
    const d = get("ui", {});
    return isDict(d) ? d : {};
  };
  const owner = () => (uiFile().home || {}).owner || "わたし";
  const peopleSet = () => {
    const d = get("people", {});
    return isDict(d) ? d : {};
  };
  function people() {
    const s = peopleSet();
    const name = (k, d) => String((isDict(s[k]) ? s[k].t : "") || d);
    return {ari: name("ari", "わたし"), kazeo: name("kazeo", "あいて")};
  }
  function peopleUi() {
    const s = peopleSet(),
      names = people(),
      out = {solo: true, onlySolo: true}; /* 体験版は この ブラウザの ひとり だけ(ふたりで は えらべない) */
    for (const k of ["ari", "kazeo"]) {
      const c = isDict(s[k]) ? s[k].c : "";
      out[k] = {t: names[k], c: c in PALETTE ? c : "", col: PALETTE[c] || null};
    }
    return out;
  }
  function setPeople(d) {
    const cur = peopleSet();
    for (const k of ["ari", "kazeo"]) {
      const v = d[k];
      if (v == null) continue;
      if (!isDict(v)) return false;
      const one = isDict(cur[k]) ? {...cur[k]} : {};
      if ("t" in v) {
        const t = cut(
          String(v.t || "")
            .split(/\s+/)
            .filter(Boolean)
            .join(" "),
          12,
        );
        if (!t) return false;
        one.t = t;
      }
      if ("c" in v) {
        if (!(v.c in PALETTE) && v.c !== "") return false;
        one.c = v.c;
      }
      cur[k] = one;
    }
    if ("solo" in d) cur.solo = d.solo === true;
    const a = (cur.ari || {}).c,
      b = (cur.kazeo || {}).c;
    /* ふたりで 同じ 色には しない(見分けられない) */
    if (a && a === b && cur.solo !== true) return false;
    put("people", cur);
    return true;
  }

  // ---- tut.py: 🔰 はじめての しつもん ----
  const KEEP = ["gojiai", "hitoiki"];
  function tutState(d) {
    const home = isDict(d.home) ? d.home : {},
      t = isDict(home.tut) ? home.tut : {};
    if (t.done) return {show: false, done: true};
    let at = t.at;
    if (typeof at !== "number") {
      at = Date.now() / 1000;
      const cur = uiFile();
      cur.home = cur.home || {};
      cur.home.tut = {...(cur.home.tut || {}), at};
      put("ui", cur);
    }
    return {show: Date.now() / 1000 - at < 3 * 86400, done: false};
  }
  const call = n => (/(さん|ちゃん|くん|君|様|さま)$/.test(n) ? n : n + "さん");
  function tutPost(d) {
    const cur = uiFile();
    const home = (cur.home = cur.home || {});
    const t = (home.tut = home.tut || {});
    if ("name" in d) {
      const name = cut(
        String(d.name || "")
          .split(/\s+/)
          .filter(Boolean)
          .join(" "),
        12,
      );
      if (name) {
        home.owner = call(name);
        if (!setPeople({ari: {t: name}})) return E({error: "name"});
      }
    }
    if ("two" in d && !setPeople({solo: d.two !== true})) return E({error: "two"});
    if ("temp" in d) {
      if (!["cold", "hot", "both"].includes(d.temp)) return E({error: "temp"});
      home.temp = d.temp;
    }
    if (d.done === true) t.done = Math.floor(Date.now() / 1000);
    if (d.again === true) {
      delete t.done;
      t.at = Date.now() / 1000;
    }
    put("ui", cur);
    return [{ok: true}, 200];
  }

  // ---- oyasumi.py: 🌙 おやすみモード(体験版は おやすみ中も ひといき を 出す) ----
  const RDEF = {auto: true, from: 23, to: 6, keep: ["gojiai", "hitoiki"]};
  const restLoad = () => {
    const d = get("oyasumi", null);
    return isDict(d) ? {...RDEF, ...d} : {...RDEF};
  };
  const night = (c, now) => {
    const f = c.from,
      t = c.to,
      h = now.getHours();
    return !!c.auto && f !== t && (f > t ? f <= h || h < t : f <= h && h < t);
  };
  const nextHour = (now, hour) => {
    const x = new Date(now);
    x.setHours(hour, 0, 0, 0);
    if (x <= now) x.setDate(x.getDate() + 1);
    return x;
  };
  const man = (c, now) => {
    const m = c.man;
    return m && m.until && new Date(m.until) > now ? m : null;
  };
  function restState(now = new Date()) {
    const c = restLoad(),
      m = man(c, now);
    const on = m ? !!m.on : night(c, now),
      why = m ? "man" : "auto";
    const until = m && on ? m.until.slice(11, 16) : on ? `${pad(c.to)}:00` : "";
    return {on, why: on ? why : "", until, auto: !!c.auto, from: c.from, to: c.to, keep: c.keep};
  }
  function restPost(d, now = new Date()) {
    const c = restLoad();
    if (typeof d.auto === "boolean") c.auto = d.auto;
    for (const k of ["from", "to"]) if (isInt(d[k]) && d[k] >= 0 && d[k] <= 23) c[k] = d[k];
    if (Array.isArray(d.keep))
      c.keep = d.keep
        .slice(0, 100)
        .map(v => cut(String(v), 24))
        .filter(x => ID.test(x));
    if (typeof d.on === "boolean") {
      if (d.on) c.man = {on: true, until: iso(nextHour(now, 4))};
      else if (night(c, now)) c.man = {on: false, until: iso(nextHour(now, c.to))};
      else delete c.man;
    }
    if (!man(c, now)) delete c.man;
    put("oyasumi", c);
  }

  // ---- appbtn.py: 📲 スマホの アプリの ショートカット ----
  // [id, 絵, 名前, iPhone の 合図, Android の パッケージ, よく使う, 四角の 色]
  const CATALOG = [
    /* 体験版は よく 使いそうな もの だけ。🔰 の しつもんには 前の 7 つ */
    ["line", "💚", "LINE", "line://", "jp.naver.line.android", true, "#1FA855"],
    ["paypay", "💴", "PayPay", "paypay://", "jp.ne.paypay.android.app", true, "#D9333F"],
    ["gmail", "📧", "Gmail", "googlegmail://", "com.google.android.gm", true, "#C5463A"],
    ["calendar", "📅", "カレンダー", "googlecalendar://", "com.google.android.calendar", true, "#3A72C9"],
    ["maps", "🗺️", "Googleマップ", "comgooglemaps://", "com.google.android.apps.maps", true, "#3B8A4F"],
    ["youtube", "▶️", "YouTube", "youtube://", "com.google.android.youtube", true, "#C4302B"],
    ["instagram", "📷", "Instagram", "instagram://", "com.instagram.android", true, "#B23A7A"],
    ["x", "✖️", "X", "twitter://", "com.twitter.android", true, "#3A3A3A"],
  ];
  const IDS = CATALOG.map(c => c[0]);
  function scRead() {
    const d = get("appbtn", {});
    const on = (Array.isArray(d.on) ? d.on : []).filter(x => IDS.includes(x));
    const web = (Array.isArray(d.web) ? d.web : []).filter(w => isDict(w) && w.id);
    return {on, web};
  }
  const scView = () => {
    const d = scRead();
    return {appbtn: true, on: d.on, web: d.web, catalog: CATALOG.map(c => c.slice(0, 5))};
  };
  function tiles() {
    const by = Object.fromEntries(CATALOG.map(c => [c[0], c])),
      d = scRead();
    const apps = d.on.map(i => ({id: "sc-" + i, e: by[i][1], t: by[i][2], c: by[i][6], sc: [by[i][3], by[i][4]]}));
    const webs = d.web.filter(w => "t" in w && "u" in w).map(w => ({id: "sc-w" + w.id, e: w.e || "🌐", t: w.t, c: "#5E7A8C", u: w.u}));
    return [...apps, ...webs];
  }
  const scClean = (v, n) =>
    cut(
      String(v || "")
        .replace(/[\x00-\x1f]/g, "")
        .trim(),
      n,
    );
  function scPost(d) {
    const cur = scRead();
    if ("on" in d) {
      const on = d.on || [];
      if (!Array.isArray(on) || !on.every(x => typeof x === "string")) return E({error: "on"});
      cur.on = [...new Set(on)].filter(x => IDS.includes(x));
    } else if ("add_web" in d) {
      const w = isDict(d.add_web) ? d.add_web : {};
      let u = scClean(w.u, 500),
        t = scClean(w.t, 24);
      const e = scClean(w.e, 16) || "🌐";
      if (u && !u.includes("://")) u = "https://" + u;
      if (!/^https?:\/\/[^\s]+\.[^\s]+$/.test(u)) return E({error: "url"});
      if (!t) t = cut(u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0], 24);
      cur.web.push({id: hex(3), u, t, e});
    } else if ("del_web" in d) cur.web = cur.web.filter(w => w.id !== d.del_web);
    else return E({error: "what"});
    put("appbtn", cur);
    return [{...scView(), sc: tiles()}, 200];
  }

  // ---- server.py: 入口の 見た目・カード・スタンプ ----
  const appsList = () => {
    const n = people();
    const name = t =>
      String(t || "")
        .replace("{ari}", n.ari)
        .replace("{kazeo}", n.kazeo);
    return DEF.apps.map(a => (a.pages ? {...a, pages: a.pages.map(p => ({...p, t: name(p.t)}))} : {...a}));
  };
  function ui() {
    const d = uiFile(),
      t = tutState(d);
    const home = {e: "🪟", t: "ぬくまど 体験版", c: "#D97A93", ...(uiFile().home || {})}; /* 体験版の 入口は いつも この 名前 */
    if (!("hidden" in home) && !t.done)
      home.hidden = appsList()
        .map(a => a.id)
        .filter(i => !KEEP.includes(i));
    return {
      home,
      tut: t,
      apps: d.apps || {},
      rest: restState(),
      nome: true,
      sc: tiles(),
      backup: "",
      base: "",
      owner: owner(),
      people: people(),
      youbou: false,
      pp: peopleUi(),
      palette: PALETTE,
      talk: false,
    };
  }
  /* その版の カードが まだ 無いとき: はじめの カードを 寒さ・暑さ の 答え(home.temp)で えらぶ */
  function cards() {
    const c = get("cards", null);
    if (Array.isArray(c)) return c;
    const temp = (uiFile().home || {}).temp;
    const no = temp === "cold" ? "hot" : temp === "hot" ? "cold" : "";
    return DEF.cards.filter(x => !no || x.s !== no);
  }
  function stamps() {
    const lim = dayOf(new Date(Date.now() - 400 * 864e5)),
      s = get("stamps", []);
    return (Array.isArray(s) ? s : []).filter(x => isDict(x) && (x.day || "") >= lim);
  }
  const ENV = {where: {known: false, home: null, room: null, at: null}, here: null, spots: [], eco2: null, ts: null, out: null, sun: null};
  function state() {
    const now = new Date();
    return {today: dayOf(now), hour: now.getHours(), minute: now.getMinutes(), cards: cards(), stamps: stamps(), env: {...ENV, town: null}};
  }
  function saveHome(fn) {
    const cur = uiFile();
    cur.home = {...(cur.home || {})};
    fn(cur);
    put("ui", cur);
  }
  function uiPost(d) {
    if (isDict(d.people)) return setPeople(d.people) ? [ui(), 200] : E({error: "people"});
    const scope = clean(d.scope, 24),
      look = {e: clean(d.e, 16), t: clean(d.t, 24), c: clean(d.c, 7)};
    if (!ID.test(scope) || !look.e || !look.t || !/^#[0-9a-fA-F]{6}$/.test(look.c)) return E({error: "ui"});
    saveHome(cur => {
      if (scope === "home") cur.home = {...cur.home, ...look};
      else cur.apps = {...(cur.apps || {}), [scope]: look};
    });
    return [ui(), 200];
  }
  function homePost(d) {
    const hidden = d.hidden,
      bg = clean(d.bg, 12);
    if (!Array.isArray(hidden) || !/^([a-z]+|#[0-9a-fA-F]{6})$/.test(bg)) return E({error: "home"});
    saveHome(cur => {
      cur.home.bg = bg;
      cur.home.hidden = hidden
        .slice(0, 100)
        .map(h => clean(h, 24))
        .filter(x => ID.test(x));
      if (typeof d.talk === "boolean") cur.home.talk = d.talk;
    });
    return [ui(), 200];
  }
  function orderPost(d) {
    if (!Array.isArray(d.order)) return E({error: "order"});
    saveHome(cur => {
      cur.home.order = d.order
        .slice(0, 200)
        .map(h => clean(h, 24))
        .filter(x => ID.test(x));
    });
    return [ui(), 200];
  }
  function stampPost(d) {
    const now = new Date();
    const s = {id: hex(5), ts: iso(now), day: dayOf(now), e: clean(d.e, 8) || "🌸", t: clean(d.t, 60), k: clean(d.k, 12), src: clean(d.src, 8)};
    if (d.card) s.card = clean(d.card, 24);
    put("stamps", [...get("stamps", []), s]);
    return [state(), 200];
  }
  function unstampPost(d) {
    const sid = clean(d.id, 24);
    put(
      "stamps",
      get("stamps", []).filter(s => s.id !== sid),
    );
    return [state(), 200];
  }
  function cardsPost(d) {
    const cs = d.cards;
    if (!Array.isArray(cs) || cs.length > 300) return E({error: "cards"});
    const out = [];
    for (const c of cs) {
      if (!isDict(c) || !clean(c.t, 60)) continue;
      const n = {id: clean(c.id, 24) || "c" + hex(4), e: clean(c.e, 8) || "🌸", t: clean(c.t, 60), k: clean(c.k, 12) || "kibun"};
      if (Array.isArray(c.w)) n.w = c.w.map(x => clean(x, 6)).slice(0, 4);
      for (const f of ["dry", "air"]) if (c[f]) n[f] = true;
      out.push(n);
    }
    put("cards", out);
    return [state(), 200];
  }

  // ---- hitoiki.py: 🍵 ひといき(たな・⚙️・きょうの げんき) ----
  const CATS = [
    ["book", "📚", "本"],
    ["music", "🎵", "音楽"],
    ["video", "🎬", "動画"],
    ["game", "🎮", "ゲーム"],
    ["photo", "🖼️", "写真"],
    ["word", "💬", "ことば"],
  ];
  const KINDS = ["brush", "breath", "yoga", "song", "look", "walk", "shelf"];
  const hkLoad = () => {
    const d = get("hitoiki", null);
    return isDict(d) && Array.isArray(d.items) ? d : {items: []};
  };
  function hkTabs(t) {
    t = isDict(t) ? t : {};
    const ok = xs => (Array.isArray(xs) ? xs : []).filter(x => typeof x === "string" && /^hitoiki(-[a-z]+)?$/.test(x)).slice(0, 30);
    return {order: ok(t.order), hide: ok(t.hide).filter(x => x !== "hitoiki-settei")};
  }
  function hkUi() {
    const u = hkLoad().ui || {};
    const off = (u.off || []).filter(k => KINDS.includes(k));
    return {off, genki: ["auto", "fix"].includes(u.genki) ? u.genki : "auto", tabs: hkTabs(u.tabs)};
  }
  const hkDay = () => {
    const d = hkLoad().day;
    return isDict(d) ? d : {};
  };
  /* げんき は 🫧 からだ から 決める ものだが、体験版には からだ が 無いので いつも 1(びみょう) */
  const hkView = () => ({hitoiki: true, day: hkDay(), items: hkLoad().items, genki: {lv: 1, why: ""}, cats: CATS, ui: hkUi()});
  const ytId = u => {
    const m = /^https:\/\/(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/))([A-Za-z0-9_-]{11})/.exec(u || "");
    return m ? m[1] : "";
  };
  const asin = u => {
    const m = /[?&]asin=([A-Z0-9]{10})/.exec(u || "") || /amazon\.[a-z.]+\/(?:.*\/)?(?:dp|gp\/product)\/([A-Z0-9]{10})/.exec(u || "");
    return m ? m[1] : "";
  };
  const one = (v, n) =>
    cut(
      String(v || "")
        .replace(/\s+/g, " ")
        .trim(),
      n,
    );
  function hkClean(d, x) {
    if ("t" in d) x.t = one(d.t, 80);
    if ("m" in d) x.m = one(d.m, 120);
    if ("url" in d) {
      let u = cut(String(d.url || "").trim(), 500);
      if (ytId(u)) u = `https://youtu.be/${ytId(u)}`;
      const a = ytId(u) ? "" : /^(B0[A-Z0-9]{8}|\d{9}[\dX])$/i.test(u) ? u.toUpperCase() : asin(u);
      if (a) u = `https://read.amazon.co.jp/?asin=${a}`;
      if (/^https:\/\/read\.amazon\./.test(u)) u = u.replace(/([?&])ref_=[^&]*&?/g, "$1").replace(/[?&]$/, "");
      x.url = /^https?:\/\//.test(u) ? u : "";
    }
    if (CATS.some(c => c[0] === d.c)) x.c = d.c;
    if ("arc" in d) {
      if (d.arc) x.arc = true;
      else delete x.arc;
    }
    if ("mood" in d) {
      if (isInt(d.mood) && d.mood >= 1 && d.mood <= 5) x.mood = d.mood;
      else delete x.mood;
    }
  }
  function hkPost(d) {
    /* リンクから 名前を 聞く のは 外の サーバーへ 行くので、体験版では わからない(空)と 返す */
    if (typeof d.kindle === "string") return [{t: "", m: ""}, 200];
    const now = iso(new Date()),
      D = hkLoad(),
      xs = D.items;
    if (isDict(d.day)) {
      const k = d.day.k,
        dd = String(d.day.d || ""),
        v = d.day.v;
      if (!["lv", "mood"].includes(k) || !/^\d{4}-\d{2}-\d{2}$/.test(dd)) return E({error: "day"});
      const ok = isInt(v) && (k === "lv" ? v >= 0 && v <= 2 : v >= 1 && v <= 5);
      D.day = isDict(D.day) ? D.day : {};
      if (ok) D.day[k] = {d: dd, v};
      else delete D.day[k];
    } else if (isDict(d.ui)) {
      const u = {...hkUi()};
      for (const k of ["off", "genki", "tabs"]) if (k in d.ui) u[k] = d.ui[k];
      const off = (Array.isArray(u.off) ? u.off : []).filter(k => KINDS.includes(k));
      D.ui = {off, genki: ["auto", "fix"].includes(u.genki) ? u.genki : "auto", tabs: hkTabs(u.tabs)};
    } else if (isDict(d.add)) {
      const x = {id: hex(5), c: "book", t: "", m: "", url: "", ts: now, seen: now};
      hkClean(d.add, x);
      if (!x.t) return E({error: "なまえを 書いてね"});
      xs.push(x);
    } else {
      const id = String(d.edit || d.del || d.seen || ""),
        x = xs.find(y => y.id === id);
      if (!x) return E({error: "id"}, 404);
      if (d.del) xs.splice(xs.indexOf(x), 1);
      else if (d.seen) x.seen = now;
      else hkClean(d, x);
    }
    put("hitoiki", D);
    return [hkView(), 200];
  }

  // ---- bgm.py: 🎵 きょく(体験版は はじめの「ひだまり」だけ。曲は 入れられない) ----
  const USE = ["brush", "yoga", "breath", "song"];
  const bgLoad = () => {
    const d = get("bgm", null);
    return isDict(d) && Array.isArray(d.songs) ? d : {songs: [], first: "hidamari"};
  };
  const bgView = (d = bgLoad()) => ({songs: d.songs, first: d.first || "hidamari", hidamari: d.hidamari || {}, norm: "norm" in d ? d.norm : true});
  const NO_SONG = {error: "体験版では 曲を 入れられません(はじめの ひだまり だけ)"};
  function bgPost(d0, json) {
    if (!json || "url" in d0) return E(NO_SONG);
    const d = bgLoad();
    if ("norm" in d0) d.norm = !!d0.norm;
    else if (Array.isArray(d0.auto)) return [{...bgView(d), guessing: d0.auto.length}, 200];
    else if ("arc" in d0) {
      const x = d.songs.find(s => s.id === String(d0.arc));
      if (!x) return E({error: "id"}, 404);
      if (d0.on !== false) {
        x.arc = true;
        if (d.first === x.id) d.first = "hidamari";
      } else delete x.arc;
    } else if ("first" in d0) {
      const f = String(d0.first || "hidamari");
      d.first = f === "hidamari" || d.songs.some(s => s.id === f) ? f : "hidamari";
    } else {
      const sid = String(d0.rename || d0.del || "");
      let x = d.songs.find(s => s.id === sid);
      if (sid === "hidamari" && d0.rename) x = d.hidamari = isDict(d.hidamari) ? d.hidamari : {};
      if (!x) return E({error: "id"}, 404);
      if (d0.del) {
        d.songs.splice(d.songs.indexOf(x), 1);
        if (d.first === sid) d.first = "hidamari";
      } else {
        if ("n" in d0) {
          const n =
            cut(
              String(d0.n || "")
                .replace(/\s+/g, " ")
                .trim(),
              60,
            ) || x.n;
          if (n) x.n = n;
        }
        if (Array.isArray(d0.use)) x.use = USE.filter(u => d0.use.includes(u));
        if (Array.isArray(d0.lv)) x.lv = [0, 1, 2].filter(v => d0.lv.includes(v));
        if (Array.isArray(d0.mood)) x.mood = [1, 2, 3, 4, 5].filter(v => d0.mood.includes(v)).slice(0, 1);
        if ("src" in d0) {
          const u = cut(String(d0.src || "").trim(), 500);
          if (/^https?:\/\//.test(u)) x.src = u;
          else if (!u) delete x.src;
        }
      }
    }
    put("bgm", d);
    return [bgView(d), 200];
  }

  // ---- 体験版に 無い 口: 画面が 落ちない「からの 返事」 ----
  const NOT = {error: "体験版では 使えません"};
  const KOE = {ok: false, el: false, voice: "", on: false, have: {}, samples: {}, sample_len: 0, memo: {}, hide: [], level: "min", vlabel: ""};
  const KOE_ALL = {...KOE, model: "", busy: null, voices: []};
  const KYOU = {gw: false, today: [], tomorrow: null, todo: [], todo_t: null, wxt: null, wxm: null, add: null, pl: null};
  const GETS = {
    "api/ui": () => ui(),
    "api/state": () => state(),
    "api/kv": () => ({}),
    "api/appbtn": () => scView(),
    "api/hitoiki": () => hkView(),
    "api/hitoiki/day": () => hkDay(),
    "api/hitoiki/koe": () => KOE_ALL,
    "api/bgm": () => bgView(),
    "api/kyou": () => KYOU,
    "api/ouchi": () => ({ouchi: false, rooms: []}),
    "api/links": () => ({links: []}),
    "api/youbou": () => ({youbou: []}),
    "api/karada": () => ({karada: false}),
    "apps.json": () => appsList(),
  };
  const POSTS = {
    "api/ui": uiPost,
    "api/home": homePost,
    "api/order": orderPost,
    "api/tut": tutPost,
    "api/rest": d => {
      restPost(d);
      return [ui(), 200];
    },
    "api/stamp": stampPost,
    "api/unstamp": unstampPost,
    "api/cards": cardsPost,
    "api/appbtn": scPost,
    "api/kv": () => [{ok: true}, 200],
    "api/hitoiki": hkPost,
    "api/hitoiki/koe": () => [{ok: false, msg: "体験版では こえは 使えません", link: {el: false, vv: false}}, 200],
    "api/ouchi": () => [{ouchi: false, rooms: [], msg: NOT.error}, 200],
    "api/wall": () => E({error: "体験版では 写真を 使えません"}),
  };

  /** 1 つの 要求に 答える → {status, text, type}。p は ページの 場所からの 相対(api/… など) */
  function answer(method, p, body, ctype) {
    const json = /application\/json/i.test(ctype || "") || typeof body === "string";
    let r;
    if (p === "youbou.html") return {status: 200, text: "", type: "text/html; charset=utf-8"};
    if (method === "GET" || method === "HEAD") {
      const f = GETS[p] || (p.startsWith("api/karada/") ? GETS["api/karada"] : null);
      r = f ? [f(), 200] : [NOT, 404];
    } else if (p === "api/bgm") {
      let d = {};
      try {
        d = typeof body === "string" ? JSON.parse(body || "{}") : {};
      } catch (e) {
        return {status: 400, text: JSON.stringify({error: "json"}), type: "application/json; charset=utf-8"};
      }
      r = bgPost(isDict(d) ? d : {}, json && typeof body === "string");
    } else {
      let d = null;
      try {
        d = typeof body === "string" ? JSON.parse(body || "{}") : null;
      } catch (e) {}
      const f = POSTS[p];
      if (!f) r = [NOT, 404];
      else if (p === "api/wall") r = f();
      else r = isDict(d) ? f(d) : E({error: "json"});
    }
    return {status: r[1], text: JSON.stringify(r[0]), type: "application/json; charset=utf-8"};
  }
  /** この サイトの 中の api/… ・ apps.json なら 相対の 場所を、ほかは null */
  function route(u) {
    let x;
    try {
      x = new URL(String(u), location.href);
    } catch (e) {
      return null;
    }
    if (x.origin !== location.origin || !x.pathname.startsWith(BASE)) return null;
    const p = decodeURIComponent(x.pathname.slice(BASE.length));
    return p.startsWith("api/") || p === "apps.json" || p === "youbou.html" ? p : null;
  }
  const ctOf = h => {
    if (!h) return "";
    if (h instanceof Headers) return h.get("content-type") || "";
    const k = Object.keys(h).find(n => n.toLowerCase() === "content-type");
    return k ? String(h[k]) : "";
  };

  // ---- fetch を 包む ----
  const fetch0 = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const isReq = typeof Request !== "undefined" && input instanceof Request;
    const p = route(isReq ? input.url : input);
    if (!p) return fetch0(input, init);
    const method = String(init.method || (isReq ? input.method : "GET")).toUpperCase();
    let body = init.body;
    if (body == null && isReq && method !== "GET") body = await input.text();
    const ct = ctOf(init.headers) || (isReq ? input.headers.get("content-type") || "" : "");
    const a = answer(method, p, typeof body === "string" ? body : body == null ? null : {}, ct);
    return new Response(method === "HEAD" ? null : a.text, {status: a.status, headers: {"Content-Type": a.type}});
  };

  // ---- XMLHttpRequest を 包む(common.js が 開いた ときに api/kv を 待って 読む) ----
  const XP = XMLHttpRequest.prototype,
    open0 = XP.open,
    send0 = XP.send,
    setH0 = XP.setRequestHeader;
  XP.open = function (method, u, ...rest) {
    const p = route(u);
    this._lite = p ? {method: String(method).toUpperCase(), p, ct: ""} : null;
    if (!p) return open0.call(this, method, u, ...rest);
  };
  XP.setRequestHeader = function (k, v) {
    if (!this._lite) return setH0.call(this, k, v);
    if (String(k).toLowerCase() === "content-type") this._lite.ct = String(v);
  };
  XP.send = function (body) {
    if (!this._lite) return send0.call(this, body);
    const L = this._lite,
      a = answer(L.method, L.p, typeof body === "string" ? body : body == null ? null : {}, L.ct);
    const def = (k, v) => Object.defineProperty(this, k, {configurable: true, value: v});
    def("readyState", 4);
    def("status", a.status);
    def("statusText", a.status === 200 ? "OK" : "");
    def("responseText", a.text);
    def("response", this.responseType === "json" ? JSON.parse(a.text) : a.text);
    def("getResponseHeader", k => (String(k).toLowerCase() === "content-type" ? a.type : null));
    const fire = () => {
      for (const n of ["readystatechange", "load", "loadend"]) this.dispatchEvent(new Event(n));
    };
    setTimeout(fire);
  };

  /* 🔰 しつもん(web/tut.js の window.TUT_Q): 体験版に 無い アプリの しつもんは 外す */
  window.TUT_PV = n => `「${/(さん|ちゃん|くん|君|様|さま)$/.test(n) ? n : n + "さん"}」と よびます`; /* 体験版は 入口の 名前を 変えない */
  window.TUT_Q = qs => qs.filter(x => x.k !== "two" && (x.k !== "app" || DEF.apps.some(a => a.id === x.id))); /* ひとりで? ふたりで? も 聞かない */
})();
