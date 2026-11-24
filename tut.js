// 🔰 はじめての しつもん(入口だけ。index.html が 読む)。。しくみは apps/tut.py、構想は artifact「ごじあい はじめての日」第 2 版
// まだ おえて いない 版では、もくもくさんが ふきだしで 🔰 を 出す。押すと 8 つの しつもん(1 画面 1 問・答えは 2 つ)で 入口を 整える。
// 答える たびに 覚える(途中で やめても そこまでは 効く)。押さなければ そのまま 使える(3 日で 🔰 は 消える)。⚙️ から もう一度 できる
(() => {
  const {el, toast} = G;
  const post = async (path, body) => {
    const r = await fetch(path, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
    if (!r.ok) throw new Error(path);
    return r.json();
  };
  const NS = (seg => (seg && seg !== "gojiai" && !seg.includes(".") ? "@" + seg : ""))(location.pathname.split("/")[1] || "");
  /* しつもん。k: "app" = アプリを 入口に 出す / "two" = ひとりで か ふたりで か / "aq" = 水族館 / "ys" = もくもくさん / "sc" = スマホの アプリ */
  const Q0 = [
    {k: "two", e: "👪", q: "ひとりで つかう? だれかと ふたりで?", h: "あとで ⚙️ の「かぞく」で 変えられるよ", yes: "ふたりで", no: "ひとりで"},
    {
      k: "temp",
      e: "🌡️",
      q: "寒いのと 暑いの、どっちが にがて?",
      h: "はじめの カードを えらぶよ。あとで 足したり 消したり できるよ",
      opts: [
        ["cold", "寒いのが にがて"],
        ["hot", "暑いのが にがて"],
        ["both", "どっちも"],
      ],
    },
    {k: "app", id: "kyou", e: "📅", q: "予定を 確認したい?", h: "日・週・月で 見られるよ", lk: "Google カレンダーと つなぐと 予定が 出るよ"},
    {k: "app", id: "yarukoto", e: "✅", q: "やることを 書きとめたい?", h: "すぐ 使えるよ"},
    {k: "app", id: "board", e: "📝", q: "買うものや メモを 書きとめたい?", h: "冷蔵庫の なかみ なども 書けるよ"},
    {k: "aq", e: "🐟", q: "しばらく さわらないとき、水族館を 出したい?", h: "10 分 さわらないと 出るよ。さわると もどるよ", yes: "出したい"},
    {k: "ys", e: "🐑", q: "もくもくさんに、いてほしい?", h: "ふわふわ ただよう だけ。しゃべらないよ", yes: "いてほしい"},
    {k: "sc", e: "📲", q: "スマホアプリで、ここから 開きたい ものは ある?", h: "押した ものが 入口に 並ぶよ"},
  ];
  const Q = window.TUT_Q ? window.TUT_Q(Q0) : Q0; /* 体験版(ぬくまど)は 無い アプリの しつもんを 外す(web/lite/api.js)。ふだんは Q0 の まま */
  const TOTAL = Q.length + 1; /* はじめの 呼び名を 入れて 8 */
  let at = 0 /* 0 = 呼び名、1.. = Q */,
    name = "",
    ans = {},
    sc = new Set(),
    catalog = [],
    dlg = null,
    fly = null;

  /* 答えを 覚える。しくじっても 先へ 進める(あとで ⚙️ から 直せる) */
  const save = {
    name: v => post("api/tut", {name: v}),
    two: v => post("api/tut", {two: v}),
    temp: v => post("api/tut", {temp: v}),
    app: async (id, on) => {
      const u = await (await fetch("api/ui", {cache: "no-store"})).json(),
        hidden = new Set(u.home.hidden || []);
      on ? hidden.delete(id) : hidden.add(id);
      await post("api/home", {hidden: [...hidden], bg: u.home.bg || "yoake"});
    },
    aq: v => localStorage.setItem("gojiai-aq-idle:" + location.pathname.replace(/[^/]*$/, ""), v ? "10" : "0"),
    ys: v => {
      const key = "gojiai-yousei-cfg" + NS;
      let c = {};
      try {
        c = JSON.parse(localStorage.getItem(key) || "{}") || {};
      } catch (e) {}
      c.on = {...(c.on || {}), moku: v};
      c.col = {...(c.col || {}), moku: (c.col || {}).moku || ["#FFFFFF", "#F2A7B5"]}; /* 白と ピンクの もくもくさん */
      localStorage.setItem(key, JSON.stringify(c));
    },
    sc: ids => post("api/appbtn", {on: ids}),
  };
  const keep = async fn => {
    try {
      await fn();
    } catch (e) {
      toast("覚えられませんでした。あとで ⚙️ から 直せます");
    }
  };

  function progress() {
    const p = el("div", "tut-prog"),
      tr = el("div", "track");
    for (let n = 0; n < TOTAL; n++) tr.append(el("span", "seg" + (n < at ? " done" : n === at ? " now" : "")));
    p.append(tr, el("span", "cnt", `${at + 1} / ${TOTAL}`));
    return p;
  }
  const btn = (label, cls, fn) => {
    const b = el("button", "tb " + (cls || ""), label);
    b.type = "button";
    b.onclick = fn;
    return b;
  };
  const mark = (v, mine) => (v === undefined ? "" : v === mine ? " was" : " dim"); /* もどった とき: 前に えらんだ ほうに ✓ */

  function draw() {
    const scr = dlg.querySelector(".tut-scr"),
      nav = dlg.querySelector(".tut-nav");
    scr.textContent = "";
    dlg.querySelector(".tut-prog").replaceWith(progress());
    nav.lastChild.textContent = at === TOTAL - 1 ? "おわり ›" : "すすむ ›";
    const btns = el("div", "tut-btns");
    if (at === 0) {
      const f = el("input", "tut-name"),
        pv = el("div", "tut-pv"),
        nx = btn("つぎへ", "", () => next());
      f.maxLength = 12;
      f.placeholder = "よびな";
      f.value = name;
      f.autocomplete = "off";
      f.setAttribute("aria-label", "よびな");
      const upd = () => {
        name = f.value.trim();
        pv.textContent = name
          ? window.TUT_PV
            ? window.TUT_PV(name)
            : `入口には「${/(さん|ちゃん|くん|君|様|さま)$/.test(name) ? name : name + "さん"}のアプリ」`
          : " ";
        nx.textContent = name ? "これで いい" : "つぎへ";
      };
      f.oninput = upd;
      f.onkeydown = e => {
        if (e.key === "Enter") next();
      };
      upd();
      scr.append(
        el("div", "big", "🙂"),
        el("p", "q", "なんて よんだら いい?"),
        el("p", "hint", "あとで いつでも 変えられるよ。空のままでも だいじょうぶ。"),
        f,
        pv,
      );
      btns.append(nx);
    } else {
      const x = Q[at - 1],
        v = ans[at];
      if (x.k === "ys") {
        /* もくもくさん の しつもんは、ひつじの 絵文字では なく もくもくさん そのもの */
        const pic = el("div", "tut-ys");
        scr.append(pic, el("p", "q", x.q));
        withYousei(() =>
          Yousei.mount(pic, {cfg: {...Yousei.load(), on: {moku: true}, col: {moku: ["#FFFFFF", "#F2A7B5"]}}, only: ["moku"], pose: "front"}),
        );
      } else scr.append(el("div", "big", x.e), el("p", "q", x.q));
      if (x.lk) scr.append(el("div", "need", "🔗 " + x.lk));
      if (x.h) scr.append(el("p", "hint", x.h));
      if (x.k === "sc") {
        const g = el("div", "tut-chips"),
          ok = btn("", mark(v, true), () => answer(sc.size > 0));
        const lab = () => {
          ok.textContent = sc.size ? "これで いい" : "えらんだら ここ";
        };
        for (const c of catalog) {
          const b = el("button", "chip" + (sc.has(c[0]) ? " on" : ""));
          b.type = "button";
          b.append(el("i", null, c[1]), c[2]);
          b.setAttribute("aria-pressed", sc.has(c[0]));
          b.onclick = () => {
            sc.has(c[0]) ? sc.delete(c[0]) : sc.add(c[0]);
            b.classList.toggle("on", sc.has(c[0]));
            b.setAttribute("aria-pressed", sc.has(c[0]));
            lab();
          };
          g.append(b);
        }
        lab();
        scr.append(g);
        btns.append(
          ok,
          btn("いまは いい", "soft" + mark(v, false), () => {
            sc.clear();
            answer(false);
          }),
        );
      } else if (x.opts) {
        /* 答えが 3 つの しつもん(寒さ・暑さ)。どれも ふつうの 答えなので 同じ 見た目 */
        for (const [val, lab] of x.opts) btns.append(btn(lab, v === undefined ? "" : v === val ? " was" : " dim", () => answer(val)));
      } else {
        btns.append(
          btn(x.yes || "つかいたい", mark(v, true), () => answer(true)),
          btn(x.no || "いまは いい", (x.no ? "" : "soft") + mark(v, false), () => answer(false)),
        );
      }
    }
    scr.append(btns);
    scr.scrollTop = 0;
  }

  async function answer(v) {
    const x = Q[at - 1];
    ans[at] = v;
    if (x.k === "two") await keep(() => save.two(v));
    else if (x.k === "temp") await keep(() => save.temp(v));
    else if (x.k === "app") await keep(() => save.app(x.id, v));
    else if (x.k === "aq") await keep(() => save.aq(v));
    else if (x.k === "ys") await keep(() => save.ys(v));
    else if (x.k === "sc") await keep(() => save.sc(v ? [...sc] : []));
    next(true);
  }
  async function next(saved) {
    if (at === 0 && !saved) await keep(() => save.name(name));
    if (at >= TOTAL - 1) return finish();
    at++;
    draw();
  }
  async function finish() {
    await keep(() => post("api/tut", {done: true}));
    try {
      sessionStorage.setItem("gojiai-tut-done", "1"); /* 開き直した 入口で「つなぐ アプリは れんけい から」を 1 回 出す */
    } catch (e) {}
    location.replace(location.pathname.replace(/[^/]*$/, ""));
  }

  async function open() {
    if (dlg) return;
    try {
      catalog = ((await (await fetch("api/appbtn", {cache: "no-store"})).json()).catalog || []).slice(0, 7); /* 「よく使う」7 つ */
    } catch (e) {
      catalog = [];
    }
    dlg = el("div", "tut");
    const nav = el("div", "tut-nav"),
      back = el("button", "nv", "‹ もどる"),
      fwd = el("button", "nv", "すすむ ›");
    back.type = fwd.type = "button";
    back.onclick = () => {
      if (at === 0) return close();
      at--;
      draw();
    };
    fwd.onclick = () => next();
    nav.append(back, fwd);
    /* 右上の ×: しつもんを とじる(ここまでの 答えは 効いた まま。🔰 は 残るので、また 押せば 続きから では なく はじめから) */
    const cx = el("button", "tut-x", "×");
    cx.type = "button";
    cx.setAttribute("aria-label", "しつもんを とじる");
    cx.onclick = close;
    dlg.append(cx, el("div", "tut-prog"), el("div", "tut-scr"), nav);
    document.body.append(dlg);
    if (fly) fly.hidden = true;
    draw();
  }
  function close() {
    dlg.remove();
    dlg = null;
    if (fly) fly.hidden = false;
  }

  /* ようせいの 部品(yousei.js・yousei.css)を 読んで から fn。読めなくても 落ちない */
  let ysWait = null;
  function withYousei(fn) {
    const run = () => {
      try {
        fn();
      } catch (e) {}
    };
    if (typeof Yousei !== "undefined") return run();
    if (!ysWait) {
      ysWait = new Promise(ok => {
        const css = el("link"),
          js = el("script");
        css.rel = "stylesheet";
        css.href = "yousei.css";
        js.src = "yousei.js";
        js.onload = ok;
        document.head.append(css, js);
      });
    }
    ysWait.then(run);
  }

  /* もくもくさん と 🔰 の ふきだし(入口の 右上に ただよう。押すと はじまる)。もくもくさんが 描けなくても ふきだしは 出す */
  function bubble() {
    fly = el("div", "tut-fly");
    const b = el("button", "bub", "🔰"),
      box = el("div", "ys-box");
    b.type = "button";
    b.setAttribute("aria-label", "はじめての しつもんを ひらく");
    b.onclick = open;
    /* × で 🔰 を しまう(押さなくて いい 人・もう一度 を 押して やめたい 人。)。おえた 扱いに して、⚙️ から また 出せる */
    const x = el("button", "bx", "×");
    x.type = "button";
    x.setAttribute("aria-label", "🔰 を しまう");
    x.onclick = async () => {
      await keep(() => post("api/tut", {done: true}));
      fly.remove();
      fly = null;
      toast("しまいました。⚙️ せってい から また 出せます");
    };
    fly.append(b, x, box);
    document.body.append(fly);
    withYousei(() =>
      Yousei.mount(box, {cfg: {...Yousei.load(), on: {moku: true}, col: {moku: ["#FFFFFF", "#F2A7B5"]}}, only: ["moku"], pose: "front"}),
    );
  }

  /* おえた あとの 入口: つなぐと 使える アプリの 案内を 1 回 だけ */
  function after() {
    let once = false;
    try {
      once = sessionStorage.getItem("gojiai-tut-done") === "1";
      sessionStorage.removeItem("gojiai-tut-done");
    } catch (e) {}
    if (!once) return;
    const n = el("div", "tut-after"),
      a = el("a", null, "⚙️ の「🔗 れんけい」を 見る"),
      x = el("button", "x", "×");
    a.href = "settei.html#links";
    x.type = "button";
    x.setAttribute("aria-label", "とじる");
    x.onclick = () => n.remove();
    n.append(el("div", null, "🫧 💰 💌 🏠 などは、つなぐと 使えるよ。"), a, x);
    document.body.append(n);
  }

  const wait = (n = 0) => {
    const u = G.ui;
    if (!u || !("tut" in u)) {
      if (n < 200) setTimeout(() => wait(n + 1), 50);
      return;
    }
    if (u.tut.show) bubble();
    else after();
    if (location.hash === "#tut" && !u.tut.done) open();
  };
  wait();
})();
