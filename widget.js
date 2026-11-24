// 🧩 入口のウィジェット: アプリ 1 行(4 つ)ぶんの帯。天気(きょう・あした)・きょうの予定・電気・＋ 予定を足す。
// 出すもの・並びは ⚙️ せってい の「🧩 ウィジェット」(この端末で覚えておく)。データは api/kyou?wx=1 と api/ouchi。
const GW = (() => {
  const {el, toast} = G;
  const ITEMS = [
    ["wx", "☀️", "天気", "きょうと あしたの天気・傘(押すとウェザーニュース)"],
    ["ev", "📅", "予定", "きょうの これからの予定"],
    ["todo", "✅", "やること", "きょうの やること(押すと やること へ)"],
    ["light", "💡", "電気", "部屋の電気を つける・消す"],
    ["sc", "🔗", "ショートカット", "よく開くアプリや ページ(下で足す)"],
    ["add", "＋", "予定を足す", "家の 記録に予定を足す"],
  ];
  const P = location.pathname.replace(/[^/]*$/, "");
  const ls = (k, d) => {
    try {
      const v = localStorage.getItem(k + P);
      return v === null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  };
  const lsSet = (k, v) => {
    try {
      localStorage.setItem(k + P, JSON.stringify(v));
    } catch (e) {}
  };
  // ウィジェットの場所: "top" = 時計の下 / "bottom" = アプリの下
  const where = () => (ls("gw-where:", "top") === "bottom" ? "bottom" : "top");
  // ショートカット [{e, t, u}]
  const scs = () => {
    const v = ls("gw-sc:", []);
    return Array.isArray(v) ? v : [];
  };
  const KEY = "gw-items:" + location.pathname.replace(/[^/]*$/, ""); // 版(持ち主・もう ひとり)ごとに覚える
  // 出す・出さない(決めていなければ 版ごとの既定 = api/kyou の gw。もう ひとりの版は出す、持ち主の版は出さない)
  let dflt = null;
  const OKEY = "gw-on:" + location.pathname.replace(/[^/]*$/, "");
  const onSet = () => {
    try {
      const v = localStorage.getItem(OKEY);
      return v === "1" ? true : v === "0" ? false : null;
    } catch (e) {
      return null;
    }
  };
  const isOn = () => onSet() ?? !!dflt;
  const setOn = v => {
    try {
      localStorage.setItem(OKEY, v ? "1" : "0");
    } catch (e) {}
  };
  const items = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(v)) return v.filter(x => ITEMS.some(i => i[0] === x));
    } catch (e) {}
    return ITEMS.map(i => i[0]);
  };
  const shown = () => (isOn() ? items() : []);
  // 電気を出す部屋(決めていなければ 寝室 だけ)
  const RKEY = "gw-rooms:" + location.pathname.replace(/[^/]*$/, "");
  const rooms = () => {
    try {
      const v = JSON.parse(localStorage.getItem(RKEY));
      if (Array.isArray(v)) return v;
    } catch (e) {}
    return ["寝室"];
  };
  const setRooms = v => {
    try {
      localStorage.setItem(RKEY, JSON.stringify(v));
    } catch (e) {}
  };
  const setItems = v => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch (e) {}
  };
  // 天気を出すところ: "strip" = 帯の中 / "clock" = 時計の横
  const PKEY = "gw-wxpos:" + location.pathname.replace(/[^/]*$/, "");
  const wxPos = () => {
    try {
      return localStorage.getItem(PKEY) === "clock" ? "clock" : "strip";
    } catch (e) {
      return "strip";
    }
  };
  const setWxPos = v => {
    try {
      localStorage.setItem(PKEY, v);
    } catch (e) {}
  };
  const SKY = (c, night) =>
    c <= 1 && night
      ? "🌙"
      : c === 0
        ? "☀️"
        : c <= 2
          ? "🌤️"
          : c === 3
            ? "☁️"
            : c <= 48
              ? "🌫️"
              : c <= 67
                ? "🌧️"
                : c <= 77
                  ? "❄️"
                  : c <= 82
                    ? "🌦️"
                    : c <= 86
                      ? "❄️"
                      : "⛈️";

  let box = null,
    K = null,
    O = null,
    busy = false,
    otimer = null;

  function draw() {
    if (!box) return;
    const on = shown().filter(k => !(k === "wx" && wxPos() === "clock")); // 時計の横に出しているときは、帯には出さない
    box.textContent = "";
    box.hidden = !on.length;
    place();
    clockWx();
    for (const k of on) {
      const sec = el("section", "s-" + k);
      if (k === "wx") wx(sec);
      else if (k === "ev") ev(sec);
      else if (k === "todo") todo(sec);
      else if (k === "light") light(sec);
      else if (k === "add") add(sec);
      else if (k === "sc") sc(sec);
      if (sec.childNodes.length) box.append(sec);
    }
  }

  // ☀️ きょう(いまの気温・傘)と あした(最低〜最高)
  function wx(sec) {
    const t = K && K.wxt,
      m = K && K.wxm,
      h = new Date().getHours();
    if (!t && !m) {
      if (!K) sec.append(el("div", "dim", "…"));
      else {
        /* 天気の 場所が 決まって いない。押すと ⚙️ からだ の「天気の場所」へ */
        const a = el("a", "dim", "天気の 場所を えらぶ ›");
        a.href = "karada-settei.html#place";
        sec.append(a);
      }
      return;
    }
    if (t) {
      const r = el("div", "big", `${SKY(t.code, h >= 18 || h < 5)} ${t.temp}°`);
      if (t.kasa) r.append(el("span", "um", t.kasa === 2 ? "☂️" : "🌂"));
      sec.append(r, el("div", "sm", `${t.lo}-${t.hi}°`));
    }
    if (m) sec.append(el("div", "sm", `明日${SKY(m.code)}${m.lo}-${m.hi}°` + (m.kasa === 2 ? "☂️" : "")));
    sec.onclick = weathernews;
  }
  // 押すと ウェザーニュースの「いまいるところ」(スマホの場所を 0.01 度 ≒ 1km に丸めて。わからなければ 家のあたり)。
  // 押したその場で ふつうに開く(場所を待ってから開くと、ホーム画面のアプリでは 何も起きないことがあった)。場所は 前に取ったもの、取れたら 次のために覚えておく
  function weathernews() {
    let c = null;
    try {
      c = JSON.parse(localStorage.getItem("gw-wxll") || "null");
    } catch (e) {}
    const ll = c || (K && K.pl) || null,
      u = ll ? `https://weathernews.jp/onebox/${ll[0]}/${ll[1]}/` : "https://weathernews.jp/";
    const w = window.open(u, "_blank");
    if (w) w.opener = null;
    else location.href = u;
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        p => {
          try {
            localStorage.setItem("gw-wxll", JSON.stringify([p.coords.latitude.toFixed(2), p.coords.longitude.toFixed(2)]));
          } catch (e) {}
        },
        () => {},
        {timeout: 8000, maximumAge: 600000},
      );
  }

  // 帯の場所: 時計の下 か アプリの下
  function place() {
    const grid = document.getElementById("grid");
    if (!grid || !box) return;
    const bottom = where() === "bottom";
    if (bottom && grid.nextSibling !== box) grid.after(box);
    if (!bottom && box.nextSibling !== grid) grid.before(box);
    box.classList.toggle("bottom", bottom);
    if (grid.dataset.pb === undefined) grid.dataset.pb = grid.style.paddingBottom;
    grid.style.paddingBottom = bottom ? "0" : grid.dataset.pb; // 下の「はなしかける」の欄のぶんは、帯の下で空ける
  }

  // 🔗 ショートカット(絵文字の丸。押すと開く)
  function sc(sec) {
    for (const s of scs()) {
      const a = el("a", "scb");
      a.href = s.u;
      a.title = s.t;
      if (/^https?:/.test(s.u)) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.append(el("i", null, s.e || "🔗"), el("span", null, s.t));
      sec.append(a);
    }
  }

  // ☀️ 時計の横に出すとき。時計は 5 秒ごとに描き直される(common.js)ので、消えたら付け直す
  let ckNode = null,
    ckObs = null;
  function clockWx() {
    const ck = document.getElementById("clock");
    if (!ck) return;
    const want = wxPos() === "clock"; // ウィジェットを出していなくても出せる
    ck.classList.toggle("with-wx", want);
    if (!want) {
      if (ckNode) ckNode.remove();
      if (ckObs) {
        ckObs.disconnect();
        ckObs = null;
      }
      return;
    }
    if (!ckNode) ckNode = el("div", "ckwx");
    ckNode.textContent = "";
    wx(ckNode);
    if (!ckNode.isConnected) ck.append(ckNode);
    if (!ckObs) {
      ckObs = new MutationObserver(() => {
        if (!ckNode.isConnected) ck.append(ckNode);
      });
      ckObs.observe(ck, {childList: true});
    }
  }

  // 📅 きょうの これからの予定(2 つまで)
  // 夜(18 時から 朝 4 時まで)は、予定と やること を あしたの分にする
  const night = () => {
    const h = new Date().getHours();
    return h >= 18 || h < 4;
  };
  function ev(sec) {
    if (K && night() && K.tomorrow) {
      const tm = K.tomorrow;
      sec.append(el("div", "tag", "あした"));
      if (!tm.length) sec.append(el("div", "dim one", "予定なし"));
      for (const e of tm.slice(0, 2)) {
        const r = el("div", "row");
        r.append(el("b", null, e.allday ? "終日" : e.s), el("span", null, e.t));
        sec.append(r);
      }
      if (tm.length > 2) sec.append(el("div", "more", `ほか ${tm.length - 2}`));
      sec.onclick = () => (location.href = "kyou.html");
      return;
    }
    const now = Date.now() / 1000,
      all = (K && K.today) || [];
    const up = all.filter(e => e.allday || e.ei > now);
    if (!K) sec.append(el("div", "dim", "…"));
    else if (!up.length) sec.append(el("div", "dim one", all.length ? "予定は おわり" : "予定なし"));
    for (const e of up.slice(0, 2)) {
      const r = el("div", "row" + (!e.allday && e.si <= now ? " now" : ""));
      r.append(el("b", null, e.allday ? "終日" : e.si <= now ? "いま" : e.s), el("span", null, e.t));
      sec.append(r);
    }
    if (up.length > 2) sec.append(el("div", "more", `ほか ${up.length - 2}`));
    sec.onclick = () => (location.href = "kyou.html");
  }

  // ✅ きょうの やること(いつまで が きょう か 過ぎたもの)。2 つまで。数で責めないよう「ほか」だけ
  function todo(sec) {
    const nt = K && night() && K.todo_t,
      xs = (K && (nt ? K.todo_t : K.todo)) || [];
    if (nt) sec.append(el("div", "tag", "あした"));
    if (!K) sec.append(el("div", "dim", "…"));
    else if (!xs.length) sec.append(el("div", "dim one", "やることは なし"));
    for (const x of xs.slice(0, 2)) {
      const r = el("div", "row");
      r.append(el("b", null, x.e || "✅"), el("span", null, x.t));
      sec.append(r);
    }
    if (xs.length > 2) sec.append(el("div", "more", "ほかも"));
    sec.onclick = () => (location.href = "yarukoto.html");
  }

  // 💡 電気: 部屋ごとに丸いボタン。押したらすぐ(家リモコンと同じ api/ouchi)
  function light(sec) {
    const want = rooms(),
      L = O && O.ouchi ? (O.rooms || []).filter(R => R.light && want.includes(R.room)) : null;
    if (!L) {
      if (!O) sec.append(el("div", "dim", "…"));
      return;
    }
    for (const R of L) {
      const l = R.light,
        b = el("button", "lb" + (l.on ? " on" : "") + (l.on === null ? " q" : ""));
      b.append(el("i", null, "💡"), el("span", null, R.room.replace(/部屋$/, ""))); // 部屋が 1 つなら、名前も出す
      b.title = `${R.room}の電気` + (l.on === null ? "(いまの状態がわからない。押すと つける)" : l.on ? "(押すと消す)" : "(押すと つける)");
      b.onclick = () => send({key: l.key, on: !l.on});
      sec.append(b);
    }
  }
  async function ouchi(body) {
    const r = await fetch(
      "api/ouchi",
      body ? {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)} : {cache: "no-store"},
    );
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  async function send(body) {
    if (busy) return;
    busy = true;
    for (const b of box.querySelectorAll(".lb")) b.disabled = true;
    try {
      O = await ouchi(body);
      if (O.msg) toast(O.msg);
    } catch (e) {
      toast("うまく届きませんでした");
    }
    busy = false;
    draw();
    poll();
  }
  function poll() {
    clearTimeout(otimer);
    if (!shown().includes("light")) return;
    otimer = setTimeout(
      () => {
        if (!document.hidden && !busy)
          ouchi()
            .then(x => {
              O = x;
              draw();
              poll();
            })
            .catch(() => {});
      },
      O && O.pending ? 1500 : 60000,
    );
  }

  // ＋ 予定を足す(📅 きょう と同じ画面。部品は押したときに読む)
  function add(sec) {
    if (K && !K.add) return;
    const b = el("button", "plus", "＋");
    b.title = "予定を足す";
    b.onclick = async () => {
      try {
        await need();
        KY.addDlg(K.add, K.day, load, K.me || "あり", K.adds);
      } catch (e) {
        toast("ひらけませんでした");
      }
    };
    sec.append(b);
  }
  let needP = null;
  function need() {
    if (typeof KY !== "undefined") return Promise.resolve();
    return (needP =
      needP ||
      new Promise((ok, ng) => {
        const c = el("link");
        c.rel = "stylesheet";
        c.href = "kyou-add.css";
        document.head.append(c);
        const s = el("script");
        s.src = "kyou.js";
        s.onload = ok;
        s.onerror = ng;
        document.head.append(s);
      }));
  }

  async function load() {
    const on = shown();
    if (dflt === null || wxPos() === "clock" || on.some(k => k !== "light")) {
      try {
        const r = await fetch("api/kyou?wx=1", {cache: "no-store"});
        if (r.ok) {
          K = await r.json();
          const was = dflt;
          dflt = !!K.gw;
          if (was === null && onSet() === null && dflt) return load();
        }
      } catch (e) {}
    }
    if (shown().includes("light")) {
      try {
        O = await ouchi();
      } catch (e) {
        O = {ouchi: false};
      }
      poll();
    }
    draw();
  }

  function mount(b) {
    box = b;
    box.classList.add("gw");
    draw();
    load();
    setInterval(load, 10 * 60000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) load();
    });
    setInterval(draw, 60000); // 「いま」を進める
  }

  // ⚙️ せってい の「🧩 ウィジェット」: 出す・出さない と 並び(長押しスライド)
  function settings(root) {
    const list = el("div", "box gws");
    // いちばん上: 入口にウィジェットを 出す・出さない
    const top = el("div", "box gwp"),
      segOn = el("div", "seg2");
    const drawOn = () => {
      segOn.textContent = "";
      for (const [v, t] of [
        [true, "出す"],
        [false, "出さない"],
      ]) {
        const b = el("button", isOn() === v ? "on" : null, t);
        b.type = "button";
        b.onclick = () => {
          setOn(v);
          drawOn();
          rest.hidden = rest1.hidden = !v;
        };
        segOn.append(b);
      }
      rest.hidden = rest1.hidden = !isOn();
    };
    top.append(el("span", "nm", "🎛️ ウィジェット"), segOn);
    const rest = el("div"),
      rest1 = el("div");
    fetch("api/kyou?wx=1", {cache: "no-store"})
      .then(r => r.json())
      .then(x => {
        dflt = !!x.gw;
        drawOn();
      })
      .catch(() => {});
    const redraw = () => {
      list.textContent = "";
      const on = items(),
        all = [...on, ...ITEMS.map(i => i[0]).filter(k => !on.includes(k))];
      for (const k of all) {
        const it = ITEMS.find(i => i[0] === k),
          lab = el("label", "rowl"),
          cb = el("input");
        cb.type = "checkbox";
        cb.checked = on.includes(k);
        cb.onchange = () => {
          setItems(cb.checked ? [...on, k] : on.filter(x => x !== k));
          redraw();
        }; // 一度さわったら、その端末では既定より こちら
        const nm = el("span", "nm", `${it[1]} ${it[2]}`);
        lab.dataset.k = k;
        lab.append(cb, nm, el("span", "grip", "⠿"));
        list.append(lab);
      }
      // 並びは 行を長押しして スライド(↑ ボタンの代わり。.claude/skills/gojiai-app)
      G.slide(list, "label.rowl", rows => {
        const o = rows.map(r => r.dataset.k).filter(x => on.includes(x));
        if (o.join() !== on.join()) {
          setItems(o);
          redraw();
        }
      });
    };
    redraw();
    // 天気を出すところ
    const pos = el("div", "box gwp"),
      seg = el("div", "seg2");
    const drawPos = () => {
      seg.textContent = "";
      for (const [v, t] of [
        ["clock", "出す"],
        ["strip", "出さない"],
      ]) {
        const b = el("button", wxPos() === v ? "on" : null, t);
        b.type = "button";
        b.onclick = () => {
          setWxPos(v);
          drawPos();
        };
        seg.append(b);
      }
    };
    drawPos();
    pos.append(el("span", "nm", "☀️ 時計の横の天気"), seg);
    // 💡 出す部屋
    const rbox = el("div", "box gwp gwr");
    const drawRooms = R => {
      rbox.textContent = "";
      rbox.append(el("span", "nm", "💡 電気"));
      const seg3 = el("div", "seg2 multi");
      for (const name of R) {
        const b = el("button", rooms().includes(name) ? "on" : null, name.replace(/部屋$/, ""));
        b.type = "button";
        b.onclick = () => {
          const v = rooms();
          setRooms(v.includes(name) ? v.filter(x => x !== name) : [...v, name]);
          drawRooms(R);
        };
        seg3.append(b);
      }
      rbox.append(seg3);
    };
    fetch("api/ouchi", {cache: "no-store"})
      .then(r => r.json())
      .then(x => drawRooms((x.rooms || []).filter(r => r.light).map(r => r.room)))
      .catch(() => {});
    // 帯の場所
    const wbox = el("div", "box gwp"),
      wseg = el("div", "seg2");
    const drawWhere = () => {
      wseg.textContent = "";
      for (const [v, t] of [
        ["top", "時計の下"],
        ["bottom", "アプリの下"],
      ]) {
        const b = el("button", where() === v ? "on" : null, t);
        b.type = "button";
        b.onclick = () => {
          lsSet("gw-where:", v);
          drawWhere();
        };
        wseg.append(b);
      }
    };
    drawWhere();
    wbox.append(el("span", "nm", "📍 場所"), wseg);
    // 🔗 ショートカット
    const sbox = el("div", "box gwsc");
    const drawSc = () => {
      sbox.textContent = "";
      const L = scs();
      L.forEach((s, i) => {
        const r = el("div", "scr"),
          x = el("button", "pen", "🗑");
        x.type = "button";
        x.title = "消す";
        x.onclick = () => {
          const v = scs();
          v.splice(i, 1);
          lsSet("gw-sc:", v);
          drawSc();
        };
        r.append(el("i", null, s.e || "🔗"), el("span", "nm", s.t), x);
        sbox.append(r);
      });
      const add = el("button", "btn", "＋ ショートカットを足す");
      add.type = "button";
      add.onclick = () =>
        scDlg(() => {
          drawSc();
          redraw();
        });
      sbox.append(add);
    };
    drawSc();
    /* 1 つの 枠に まとめる。？ で これは 何かを 出す */
    const grp = el("div", "box gwall"),
      hd = el("h2", null, "ウィジェット "),
      q = el("button", "q", "？"),
      help = el("p", "sub");
    q.type = "button";
    q.setAttribute("aria-label", "ウィジェットの 説明");
    help.textContent =
      "入口の 時計の 下に 出る 小さな 帯です。天気・きょうの 予定・部屋の 温度 などを、アプリを 開かずに ひと目で 見られます。出す ものに チェックを 付けて、行を 長押しすると 並べかえられます。";
    help.hidden = true;
    q.onclick = () => {
      help.hidden = !help.hidden;
    };
    hd.append(q);
    rest1.append(el("div", "gwsub"), list, wbox, rbox);
    grp.append(top, pos, rest1);
    rest.append(el("h2", null, "🔗 ショートカット"), sbox);
    root.append(hd, help, grp, rest);
    drawOn();
  }

  // ショートカットを足す: ごじあいのアプリから選ぶ か、名前と URL
  async function scDlg(done) {
    const dlg = el("dialog", "ui"),
      f = el("form");
    f.method = "dialog";
    const e = el("input");
    e.placeholder = "🔗";
    e.maxLength = 4;
    e.style.cssText = "flex:none;width:68px;text-align:center";
    const t = el("input");
    t.placeholder = "名前";
    t.maxLength = 12;
    const u = el("input");
    u.placeholder = "https://… か アプリの場所";
    u.inputMode = "url";
    u.autocomplete = "off";
    u.spellcheck = false;
    const pick = el("div", "picks");
    try {
      const A = await (await fetch("apps.json", {cache: "no-store"})).json();
      for (const a of A) {
        if (a.soon) continue;
        const b = el("button", null, `${a.e} ${a.t}`);
        b.type = "button";
        b.onclick = () => {
          e.value = a.e;
          t.value = a.t;
          u.value = a.u || a.pages[0].u;
        };
        pick.append(b);
      }
    } catch (x) {}
    const r1 = el("div", "r"),
      r2 = el("div", "r");
    r1.append(e, t);
    r2.append(u);
    const no = el("button", "no", "やめる"),
      ok = el("button", "ok", "足す");
    no.type = "button";
    no.onclick = () => dlg.close();
    const acts = el("div", "r");
    acts.append(no, ok);
    f.append(el("div", "dh", "ショートカットを足す"), pick, r1, r2, acts);
    f.onsubmit = ev => {
      ev.preventDefault();
      const url = u.value.trim();
      if (!t.value.trim() || !url) {
        (t.value.trim() ? u : t).focus();
        return;
      }
      if (/^\s*javascript:/i.test(url)) {
        toast("その URL は使えません");
        return;
      }
      lsSet("gw-sc:", [...scs(), {e: e.value.trim() || "🔗", t: t.value.trim(), u: url}]);
      const it = items();
      if (!it.includes("sc")) lsSet("gw-items:", [...it, "sc"]);
      dlg.close();
      toast("足しました");
      done();
    };
    dlg.append(f);
    dlg.onclose = () => dlg.remove();
    document.body.append(dlg);
    dlg.showModal();
  }

  return {mount, settings, items};
})();
