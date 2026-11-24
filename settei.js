// ⚙️ せってい の 画面(settei.html だけが 読む)。web/common.js から 分けた(2026-11-24。入口や ほかの アプリの ページは 読まない ので 軽く なる)。
// common.js の 中の 部品は G._in から 借りる。変わって いく 値(font・full・homeInk・mode・onLook・puru・shell・theme・tsuya)は I.名前 で その ときの 値を 見る。
// ---- せってい(settei.html): アプリ・背景・見た目 の3枚。押したらすぐ覚える。設定が増えたら TABS と pane を足す ----
(() => {
  const I = G._in;
  const {
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
    peopleLook,
  } = I;
  G.settei = async function settei(root) {
    await bar(null, "⚙️ せってい");
    document.title = "せってい";
    const hidden = new Set(I.shell.ui.home.hidden || []);
    let bg = I.shell.ui.home.bg || "yoake";
    const save = async () => {
      try {
        const r = await fetch("api/home", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({hidden: [...hidden], bg}),
        });
        if (!r.ok) throw 0;
        I.shell.ui = await r.json();
        toast("覚えました");
      } catch (x) {
        toast("覚えられませんでした");
      }
    };
    const TABS = [
        ["apps", "🧩 アプリ"],
        ["sc", "📲 スマホアプリ"],
        ["wall", "🖼️ 入口"],
        ["look", "🎨 見た目"],
        ["rest", "🌙 おやすみ"],
        ["yousei", "🪼 ようせい"],
        ["people", "👪 かぞく"],
        ["links", "🔗 れんけい"],
        ["about", "ℹ️ このアプリ"],
      ],
      pane = {},
      tab = {};
    const tabs = el("div");
    tabs.id = "tabs";
    document.querySelector("header").append(tabWrap(tabs));
    const show = k => {
      for (const [id] of TABS) {
        pane[id].hidden = id !== k;
        tab[id].classList.toggle("on", id === k);
      }
      tab[k].scrollIntoView({inline: "center", block: "nearest", behavior: "smooth"});
      history.replaceState(null, "", "#" + k);
    };
    for (const [id, t] of TABS) {
      tab[id] = el("button", "tab", t);
      tab[id].onclick = () => show(id);
      tabs.append(tab[id]);
      pane[id] = el("section");
      root.append(pane[id]);
    }

    // アプリ
    const list = el("div", "box rows"),
      list2 = el("div", "box rows"),
      h2b = el("h2", null, "📲 スマホアプリ(ショートカット)");
    /* 🔗 ほかの ページを 開く だけの 四角(apps.json に "u" が ある もの。うちの ページ・外の ページ・Claudeさん)は アプリと 分けて 並べる */
    const list3 = el("div", "box rows"),
      h2c = el("h2", null, "🔗 ほかのページ(ショートカット)");
    const apps = () => {
      list.textContent = list2.textContent = list3.textContent = "";
      for (const a of ordered()) {
        const L = look(a.id),
          lab = el("label", "rowl"),
          cb = el("input");
        cb.type = "checkbox";
        cb.checked = !hidden.has(a.id);
        cb.onchange = () => {
          cb.checked ? hidden.delete(a.id) : hidden.add(a.id);
          save();
        };
        const ic = el("span", "mini", L.e);
        ic.style.background = L.c || "#B84E33";
        const pen = el("button", "pen", "✎");
        pen.type = "button";
        pen.title = "絵文字・名前・色を変える";
        pen.onclick = ev => {
          ev.preventDefault();
          editLook(a.id);
        };
        lab.dataset.k = a.id;
        lab.append(cb, ic, el("span", "nm", L.t + (a.soon ? "(これから)" : "")), pen, el("span", "grip", "≡"));
        (a.sc ? list2 : a.u ? list3 : list).append(lab);
      }
      h2b.hidden = list2.hidden = !list2.children.length;
      h2c.hidden = list3.hidden = !list3.children.length;
      /* 並び順: 行を 長押しして 上下に(入口の 並びに なる。) */
      for (const box of [list, list3, list2]) G.slide(box, "label.rowl", saveOrder);
    };
    const saveOrder = async () => {
      const order = [list, list3, list2].flatMap(b => [...b.querySelectorAll("label.rowl")].map(r => r.dataset.k));
      try {
        const r = await fetch("api/order", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({order})});
        if (!r.ok) throw 0;
        I.shell.ui = await r.json();
        toast("並び順を 覚えました");
      } catch (e) {
        toast("覚えられませんでした");
      }
    };
    apps();
    I.onLook = apps;
    /* 説明は ？ の 中(見出しの 右) */
    const hApps = el("h2", null, "ごじあいのアプリ "),
      qApps = el("button", "q", "？"),
      helpApps = el("p", "sub");
    qApps.type = "button";
    qApps.setAttribute("aria-label", "アプリの 一覧の 説明");
    helpApps.textContent =
      "チェックを 外すと 入口から しまいます。✎ で 絵・名前・色を 変えられます。行を 長押しして 上下に 動かすと、入口の 並び順が 変わります。";
    helpApps.hidden = true;
    qApps.onclick = () => {
      helpApps.hidden = !helpApps.hidden;
    };
    hApps.append(qApps);
    // 入口の 何もないところを 長押し → 並べかえ(この端末で覚える。はじめは 版ごと: home.dflt.lparr)
    const lpl = el("label", "rowl"),
      lpc = el("input"),
      lpb = el("div", "box rows");
    lpc.type = "checkbox";
    lpc.checked = lpOn();
    lpc.onchange = () => {
      try {
        localStorage.setItem(LS("gojiai-lparr"), lpc.checked ? "1" : "0");
      } catch (e) {}
      toast(lpc.checked ? "入口の 何もないところを 長押しで 並べかえ" : "長押しの 並べかえを やめました");
    };
    lpl.append(lpc, el("span", "nm", "入口でも 長押しで 並べかえる(何も ない ところを 長押し)"));
    lpb.append(lpl);
    pane.apps.append(hApps, helpApps, list, h2c, list3, h2b, list2, lpb);
    // 🕰️ ひらいた記録: 開いたら うすく → 時間がたつと もとに。きょう・この 7 日の 回数と 最後に開いた時刻(この端末だけ)
    {
      const fb = el("div", "rows"),
        seg = el("div", "chips2"),
        stat = el("div", "rows");
      const drawFade = () => {
        seg.textContent = "";
        for (const [v, t] of [
          [0, "しない"],
          [30, "30分"],
          [60, "1時間"],
          [180, "3時間"],
          [360, "6時間"],
          [720, "12時間"],
          [1440, "1日"],
        ]) {
          const b = el("button", v === fadeMin() ? "on" : null, t);
          b.type = "button";
          b.onclick = () => {
            try {
              localStorage.setItem(LS("gojiai-fade"), String(v));
            } catch (e) {}
            drawFade();
            toast(v ? `開いたら うすく、${t}で もとの こさに` : "うすくするのを やめました");
          };
          seg.append(b);
        }
      };
      drawFade();
      fb.append(el("div", "nm", "開いたアプリを うすくして、だんだん もどす(ぜんたい)"), seg);
      const o = opensGet(),
        now = Date.now(),
        td = dayKey(now),
        wk = new Set([...Array(7)].map((_, i) => dayKey(now - i * 864e5)));
      const hm = t => {
        const d = new Date(t);
        return (dayKey(t) === td ? "" : `${d.getMonth() + 1}/${d.getDate()} `) + `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
      };
      // アプリごと: 開いたものは 新しい順、まだのものは 並び順で後ろに。右の えらぶ で その アプリだけの時間(はじめは「ぜんたい と同じ」)
      const hid = new Set(I.shell.ui.home.hidden || []);
      const rows = ordered()
        .filter(a => !hid.has(a.id))
        .map(a => [a, o[a.id]])
        .sort((p, q) => ((q[1] && q[1].last) || 0) - ((p[1] && p[1].last) || 0));
      const CH = [
        ["", "ぜんたい"],
        [0, "しない"],
        [30, "30分"],
        [60, "1時間"],
        [180, "3時間"],
        [360, "6時間"],
        [720, "12時間"],
        [1440, "1日"],
        [4320, "3日"],
        [10080, "1週間"],
      ];
      const sels = {};
      for (const [a, x] of rows) {
        const L = look(a.id),
          r = el("div", "rowl opr"),
          ic = el("span", "mini", L.e);
        ic.style.background = L.c || "#B84E33";
        const n7 = x
          ? Object.entries(x.days)
              .filter(([d]) => wk.has(d))
              .reduce((s, [, n]) => s + n, 0)
          : 0;
        const tx = el("span", "nm");
        tx.append(L.t, el("small", "opn", x && x.last ? `きょう${x.days[td] || 0}・7日${n7}・${hm(x.last)}` : "まだ 開いていません"));
        const sel = el("select", "fsel"),
          f = fadeApp();
        for (const [v, t] of CH) {
          const op = el("option", null, t);
          op.value = String(v);
          sel.append(op);
        }
        sel.value = a.id in f ? String(f[a.id]) : "";
        sels[a.id] = sel;
        sel.setAttribute("aria-label", `${L.t} を うすくする時間`);
        sel.onchange = () => {
          const g = fadeApp();
          if (sel.value === "") delete g[a.id];
          else g[a.id] = Number(sel.value);
          try {
            localStorage.setItem(LS("gojiai-fade-app"), JSON.stringify(g));
          } catch (e) {}
          toast(`${L.t}: ${sel.selectedOptions[0].textContent}`);
        };
        r.append(ic, tx, sel);
        stat.append(r);
      }
      // おすすめ: 見る回数に合わせて「次に見るころ」に こく もどる
      const REC = {
        message: 720,
        okane: 4320,
        karada: 1440,
        kyou: 180,
        yarukoto: 180,
        board: 180,
        ouchi: 0,
        claude: 0,
        maipuchi: 180,
        arisanchi: 180,
        gojiai: 0, // うちの ページ・外の ページ は 3 時間
        "sc-line": 180,
        "sc-discord": 180,
        "sc-x": 360,
      };
      const rec = el("button", "btn", "✨ おすすめにする(アプリごと)");
      rec.type = "button";
      rec.onclick = () => {
        const g = {...fadeApp(), ...REC};
        try {
          localStorage.setItem(LS("gojiai-fade-app"), JSON.stringify(g));
        } catch (e) {}
        for (const [id, sel] of Object.entries(sels)) if (id in g) sel.value = String(g[id]);
        toast("おすすめに しました");
      };
      /* 1 つの 枠に まとめる: うすく する 時間 → おすすめ → アプリごと。説明は ？ の 中 */
      const wrap = el("div", "box fadeall"),
        hd = el("h2", null, "🕰️ ひらいた記録 "),
        q = el("button", "q", "？"),
        help = el(
          "p",
          "sub",
          "開いた アプリの 四角を うすく して、時間が たつと もとの こさに 戻します。この 端末で 開いた 分だけ です(サーバーには 送りません)。",
        );
      q.type = "button";
      q.setAttribute("aria-label", "ひらいた記録の 説明");
      help.hidden = true;
      q.onclick = () => {
        help.hidden = !help.hidden;
      };
      hd.append(q);
      wrap.append(fb, rec, stat);
      pane.apps.append(hd, help, wrap);
    }
    /* 説明は 見出しの ？ の 中 */
    const qh = (title, text) => {
      const h = el("h2", null, title + " "),
        q = el("button", "q", "？"),
        p = el("p", "sub", text);
      q.type = "button";
      q.setAttribute("aria-label", title + " の 説明");
      p.hidden = true;
      q.onclick = () => {
        p.hidden = !p.hidden;
      };
      h.append(q);
      return [h, p];
    };
    // 📲 スマホのアプリを ショートカットとして入口に足す(apps/appbtn.py)。足したものは上の一覧にも出て、しまう・名前を変えるが ふつうのアプリと同じにできる
    const scl = el("div", "box rows"),
      wl = el("div", "box rows");
    let SC = null;
    const scPost = async (body, msg) => {
      try {
        const r = await fetch("api/appbtn", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
        if (!r.ok) throw 0;
        SC = await r.json();
        I.shell.apps = I.shell.apps.filter(x => !String(x.id).startsWith("sc-")).concat(SC.sc);
        I.shell.ui.sc = SC.sc;
        apps();
        scPaint();
        toast(msg);
      } catch (x) {
        toast(body.add_web ? "そのアドレスでは足せませんでした" : "覚えられませんでした");
        scPaint();
      }
    };
    const penFor = id => {
      const p = el("button", "pen", "✎");
      p.type = "button";
      p.title = "絵文字・名前・色を変える";
      p.onclick = ev => {
        ev.preventDefault();
        editLook(id);
      };
      return p;
    };
    const scPaint = () => {
      scl.textContent = wl.textContent = "";
      for (const [id, e, t] of SC.catalog) {
        const on = SC.on.includes(id),
          L = on ? look("sc-" + id) : {e, t};
        const lab = el("label", "rowl"),
          cb = el("input");
        cb.type = "checkbox";
        cb.checked = on;
        cb.onchange = () =>
          scPost({on: cb.checked ? [...SC.on, id] : SC.on.filter(x => x !== id)}, cb.checked ? `${t} を入口に足しました` : `${t} をはずしました`);
        lab.append(cb, el("span", "nm", `${L.e} ${L.t}`));
        if (on) lab.append(penFor("sc-" + id));
        scl.append(lab);
      }
      for (const w of SC.web) {
        const L = look("sc-w" + w.id),
          r = el("div", "rowl"),
          del = el("button", "pen", "✕");
        del.type = "button";
        del.title = "はずす";
        del.onclick = () => scPost({del_web: w.id}, `${L.t} をはずしました`);
        const nm = el("span", "nm");
        nm.append(`${L.e} ${L.t}`, el("br"), el("small", "sub", w.u.replace(/^https?:\/\//, "").slice(0, 40)));
        r.append(nm, penFor("sc-w" + w.id), del);
        wl.append(r);
      }
      if (!SC.web.length) wl.append(el("div", "empty", "まだ ありません。"));
    };
    const addWeb = el("button", "btn", "＋ サイトを足す");
    addWeb.onclick = () => {
      const dlg = el("dialog", "ui"),
        form = el("form");
      form.method = "dialog";
      const u = el("input");
      u.type = "url";
      u.placeholder = "https://…(アドレス)";
      u.setAttribute("aria-label", "アドレス");
      u.style.width = "100%";
      const e = el("input");
      e.value = "🌐";
      e.maxLength = 16;
      e.className = "em";
      e.setAttribute("aria-label", "絵文字");
      const t = el("input");
      t.placeholder = "名前(なくてもいい)";
      t.maxLength = 24;
      t.setAttribute("aria-label", "名前");
      const row = el("div", "r");
      row.append(e, t);
      const ok = el("button", "ok", "足す"),
        no = el("button", "no", "やめる");
      no.type = "button";
      no.onclick = () => dlg.close();
      const acts = el("div", "r");
      acts.append(no, ok);
      form.append(
        el("div", "dh", "サイトのショートカット"),
        u,
        row,
        el("div", "sub", "Chrome でそのページを開いて、アドレスを長押しで写して 貼りつけてください。"),
        acts,
      );
      form.onsubmit = ev => {
        ev.preventDefault();
        if (!u.value.trim()) return;
        dlg.close();
        scPost({add_web: {u: u.value.trim(), t: t.value.trim(), e: e.value.trim()}}, "入口に足しました");
      };
      dlg.append(form);
      dlg.onclose = () => dlg.remove();
      document.body.append(dlg);
      dlg.showModal();
      u.focus();
    };
    (async () => {
      try {
        SC = await (await fetch("api/appbtn", {cache: "no-store"})).json();
        scPaint();
      } catch (x) {
        scl.textContent = "読めませんでした";
      }
    })();
    I.onLook = () => {
      apps();
      if (SC) scPaint();
    };
    pane.sc.append(
      ...qh(
        "📲 スマホアプリ",
        "チェックすると、その アプリを 開く 四角が 入口に 並びます(iPhone でも Android でも)。✎ で 絵文字・名前・色を 変えられます。",
      ),
      scl,
      ...qh("🌐 サイトの ショートカット", "よく 見る ページを、入口の 四角に できます(Chrome の「ホーム画面に追加」の ような もの)。"),
      wl,
      addWeb,
    );

    // 背景
    const pv = el("div", "pv"),
      pvt = el("div", "tm", "12:34"),
      pvi = el("div", "ics");
    for (const a of ordered().slice(0, 4)) {
      const i = el("span", "mini", look(a.id).e);
      i.style.background = look(a.id).c || "#B84E33";
      pvi.append(i);
    }
    pv.append(pvt, pvi);
    const sw = el("div", "sws"),
      free = el("input");
    free.type = "color";
    free.value = bg[0] === "#" ? bg : "#FBF4E8";
    free.title = "好きな色";
    const mark = () => {
      for (const b of sw.querySelectorAll("button")) b.classList.toggle("on", b.dataset.k === bg);
      free.classList.toggle("on", bg[0] === "#");
      pv.style.background = wallCss(bg);
      pv.style.color = wallInk(bg)[0] || "";
      pv.classList.toggle("photo", bg === "photo");
    };
    const walls = () => {
      sw.textContent = "";
      for (const [k, w] of Object.entries(WALLS)) {
        const b = el("button");
        b.dataset.k = k;
        b.title = w[0];
        b.style.background = w[I.theme === "dark" ? 2 : 1];
        b.onclick = () => {
          bg = k;
          mark();
          save();
        };
        sw.append(b);
      }
      sw.append(free);
      if (I.shell.ui.home.wallv) {
        const ph = el("button");
        ph.dataset.k = "photo";
        ph.title = "いまの写真";
        ph.style.background = wallCss("photo");
        ph.onclick = () => {
          bg = "photo";
          mark();
          save();
        };
        sw.append(ph);
      }
      mark();
    };
    free.oninput = () => {
      bg = free.value;
      mark();
    };
    free.onchange = () => save();
    const pick = el("input");
    pick.type = "file";
    pick.accept = "image/*";
    pick.hidden = true;
    const add = el("button", "btn", "📷 写真をえらぶ");
    add.onclick = () => pick.click();
    pick.onchange = async () => {
      if (!pick.files[0]) return;
      add.textContent = "送っています…";
      try {
        await sendPhoto(pick.files[0]);
        bg = "photo";
        walls();
        toast("写真を敷きました");
      } catch (x) {
        toast("写真を送れませんでした");
      }
      add.textContent = "📷 写真をえらぶ";
      pick.value = "";
    };
    pane.wall.append(el("h2", null, "入口の背景"), pv, sw, add, pick);
    // 💬 はなしかける(入口のいちばん下の欄)を出すか
    const tkl = el("label", "rowl"),
      tc = el("input"),
      tbox = el("div", "box rows");
    tc.type = "checkbox";
    tc.checked = I.shell.ui.home.talk !== false;
    tc.onchange = async () => {
      try {
        const r = await fetch("api/home", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({hidden: [...hidden], bg, talk: tc.checked}),
        });
        if (!r.ok) throw 0;
        I.shell.ui = await r.json();
        toast(tc.checked ? "はなしかける を出します" : "はなしかける を しまいました");
      } catch (x) {
        toast("覚えられませんでした");
        tc.checked = !tc.checked;
      }
    };
    tkl.append(tc, el("span", "nm", "💬 はなしかける を出す"));
    tbox.append(tkl);
    if (I.shell.ui.talk) pane.wall.append(el("h2", null, "入口の下の欄"), tbox); /* 💬 はなしかける を 使える 版だけ(config.json の talk) */
    if (typeof GW !== "undefined") GW.settings(pane.wall); // 入口のウィジェット(widget.js)。背景と同じタブに
    if (window.AQ && AQ.settings) AQ.settings(pane.wall); // 🐟 水そう(aquarium.js)

    // 見た目
    const seg = el("div", "seg"),
      MODES = [
        ["auto", "📱 おまかせ"],
        ["light", "☀️ 明るい"],
        ["dark", "🌙 暗い"],
      ];
    const segs = () => {
      for (const b of seg.children) b.classList.toggle("on", b.dataset.m === I.mode);
    };
    for (const [m, t] of MODES) {
      const b = el("button", null, t);
      b.dataset.m = m;
      b.onclick = () => {
        setMode(m);
        segs();
        walls();
      };
      seg.append(b);
    }
    segs();
    const nm = el("button", "btn", "✎ 入口の名前・絵文字・色");
    nm.onclick = () => editLook("home");
    const fl = el("label", "rowl"),
      fc = el("input");
    fc.type = "checkbox";
    fc.checked = I.full;
    fc.disabled = !canFull;
    fc.onchange = () => setFull(fc.checked);
    fl.append(fc, el("span", "nm", "全画面にする"));
    const fbox = el("div", "box rows");
    fbox.append(fl);
    pane.look.append(
      el("h2", null, "ダークモード"),
      seg,
      el("h2", null, "字のフォント"),
      (() => {
        const g = el("div", "fonts");
        for (const f of FONTS) {
          const b = el("button", f[0] === I.font ? "on" : null, "あいう 12:34");
          b.type = "button";
          b.append(el("small", null, f[1]));
          if (f[2]) {
            fontLink("gfont-pv-" + f[0], fontUrl(f));
            b.style.fontFamily = `"${f[2]}",sans-serif`;
          }
          b.onclick = () => {
            setFont(f[0]);
            for (const x of g.children) x.classList.toggle("on", x === b);
          };
          g.append(b);
        }
        return g;
      })(),
      el("h2", null, "入口の字の色"),
      (() => {
        const sw = el("div", "sws"),
          free = el("input");
        free.type = "color";
        free.value = I.homeInk || "#3A322D";
        free.title = "好きな色";
        const mark = () => {
          for (const b of sw.querySelectorAll("button")) b.classList.toggle("on", (b.dataset.c || "") === I.homeInk);
          free.classList.toggle("on", !!I.homeInk && ![...sw.querySelectorAll("button")].some(b => b.dataset.c === I.homeInk));
        };
        const auto = el("button", null, "A");
        auto.type = "button";
        auto.title = "おまかせ(背景に合わせる)";
        auto.dataset.c = "";
        auto.style.cssText = "background:var(--card);font:700 15px var(--head)";
        auto.onclick = () => {
          setInk("");
          mark();
        };
        sw.append(auto);
        for (const c of ["#3A322D", "#FFFFFF", "#F3EADB", "#B84E33", "#2E837B", "#3F6A9A", "#5B4B8A", "#B5506E"]) {
          const b = el("button");
          b.type = "button";
          b.dataset.c = c;
          b.title = c;
          b.style.background = c;
          b.onclick = () => {
            setInk(c);
            mark();
          };
          sw.append(b);
        }
        free.oninput = () => {
          setInk(free.value.toUpperCase());
          mark();
        };
        sw.append(free);
        mark();
        return sw;
      })(),
      el("h2", null, "アプリの四角とボタン"),
      (() => {
        const l = el("label", "rowl"),
          c = el("input"),
          b = el("div", "box rows");
        c.type = "checkbox";
        c.checked = I.puru;
        c.onchange = () => setPuru(c.checked);
        l.append(c, el("span", "nm", "押すと ぷるんとする"));
        const l2 = el("label", "rowl"),
          c2 = el("input");
        c2.type = "checkbox";
        c2.checked = I.tsuya;
        c2.onchange = () => setTsuya(c2.checked);
        l2.append(c2, el("span", "nm", "アプリの四角を ぷるんとした見た目にする"));
        b.append(l2, l);
        return b;
      })(),
      el("h2", null, "入口の名前"),
      nm,
    );
    /* 入口の 名前・入口の 字の色 は 🖼️ 入口 の タブへ。全画面 は 出さない */
    {
      const take = t => {
        const h = [...pane.look.querySelectorAll("h2")].find(x => x.textContent === t);
        return h ? [h, h.nextElementSibling] : [];
      };
      const wh = [...pane.wall.querySelectorAll("h2")].find(x => x.textContent === "入口の背景");
      const [nh, nb] = take("入口の名前"),
        [ih, ib] = take("入口の字の色");
      if (wh && nh) wh.before(nh, nb);
      if (pick && ih) pick.after(ih, ib);
    }

    // おやすみ
    const R = () => I.shell.ui.rest || {},
      rnow = el("button", "btn"),
      rauto = el("input");
    rauto.type = "checkbox";
    const hsel = v => {
      const s = el("select");
      for (let h = 0; h < 24; h++) {
        const o = el("option", null, `${h}時`);
        o.value = h;
        s.append(o);
      }
      s.value = v;
      return s;
    };
    const rf = hsel(R().from ?? 23),
      rt = hsel(R().to ?? 6),
      rkeep = el("div", "box rows");
    const rdraw = () => {
      rnow.textContent = R().on ? `🌙 いま おやすみ中(${R().until} まで)。おわる` : "🌙 いま おやすみモードにする";
      rauto.checked = !!R().auto;
      rf.value = R().from;
      rt.value = R().to;
      rkeep.textContent = "";
      const keep = new Set(R().keep || []);
      for (const a of ordered()) {
        const L = look(a.id),
          lab = el("label", "rowl"),
          cb = el("input");
        cb.type = "checkbox";
        cb.checked = keep.has(a.id);
        cb.onchange = async () => {
          cb.checked ? keep.add(a.id) : keep.delete(a.id);
          if (await setRest({keep: [...keep]})) toast("覚えました");
          rdraw();
        };
        const ic = el("span", "mini", L.e);
        ic.style.background = L.c || "#B84E33";
        lab.append(cb, ic, el("span", "nm", L.t));
        rkeep.append(lab);
      }
    };
    rnow.onclick = async () => {
      await setRest({on: !R().on});
      rdraw();
    };
    rauto.onchange = async () => {
      if (await setRest({auto: rauto.checked})) toast("覚えました");
      rdraw();
    };
    rf.onchange = rt.onchange = async () => {
      if (await setRest({from: Number(rf.value), to: Number(rt.value)})) toast("覚えました");
      rdraw();
    };
    const al = el("label", "rowl");
    al.append(rauto, el("span", "nm", "夜は自動で入る"));
    const tl = el("div", "rowl hours");
    tl.append(rf, el("span", null, "から"), rt, el("span", null, "まで"));
    const abox = el("div", "box rows");
    abox.append(al, tl);
    pane.rest.append(el("h2", null, "おやすみモード"), rnow, el("h2", null, "夜"), abox, el("h2", null, "おやすみ中も出すアプリ"), rkeep);
    rdraw();

    // ようせい: 上に プレビューと お盆を とめて、下に ひとりずつ(住まわせる・色・うごき)。部品は yousei.js(このタブを作るときに読みこむ)
    needYousei()
      .then(Y => {
        const cfg = Y.load(),
          keep = () => {
            Y.save(cfg);
            ctrl.set(cfg);
            hint.hidden = Y.anyOn(cfg);
          };
        const top = el("div", "ys-top"),
          stage = el("div", "ys-stage"),
          tiles = el("div", "ys-tiles"),
          hint = el("div", "ys-hint", "下で チェックした子が、ここに出てきます。"),
          trayBox = el("div");
        for (const a of ordered().slice(0, 4)) {
          const i = el("i");
          i.style.background = look(a.id).c || "#B84E33";
          tiles.append(i);
        }
        stage.append(tiles, hint);
        top.append(stage, trayBox);
        hint.hidden = Y.anyOn(cfg);
        const moods = el("div", "ys-moods");
        let mi = 0;
        Y.MOODS.forEach((t, i) => {
          const b = el("button", i ? null : "on", t);
          b.type = "button";
          b.onclick = () => {
            mi = i;
            ctrl.mood(i);
            [...moods.children].forEach((x, n) => x.classList.toggle("on", n === i));
          };
          moods.append(b);
        });
        pane.yousei.append(top);
        let first = true;
        for (const [k, K] of Object.entries(Y.KINDS)) {
          if (K.draft) continue; // ためしの子は出さない(yousei-tameshi.html で見る)
          const one = el("details", "box ys-one"),
            sum = el("summary"),
            cb = el("input"),
            inn = el("div", "in");
          cb.type = "checkbox";
          cb.checked = cfg.on[k];
          cb.onchange = () => {
            cfg.on[k] = cb.checked;
            keep();
            toast(cb.checked ? `${K.name}が 入口に住みます` : `${K.name}は おやすみ`);
          };
          sum.append(cb, el("span", null, K.name));
          one.append(sum, inn);
          ["からだの色", "かざりの色"].forEach((t, n) => {
            // きまった色から、または 好きな色
            const row = el("div", "ys-pal"),
              free = el("input");
            free.type = "color";
            free.value = cfg.col[k][n];
            free.title = "好きな色";
            free.setAttribute("aria-label", `${K.name}の ${t}(好きな色)`);
            const mark = () => {
              let hit = false;
              for (const b of row.querySelectorAll("button")) {
                const on = b.dataset.c === cfg.col[k][n].toUpperCase();
                b.classList.toggle("on", on);
                hit = hit || on;
              }
              free.classList.toggle("on", !hit);
            };
            const set = c => {
              cfg.col[k][n] = c.toUpperCase();
              keep();
              mark();
            };
            for (const c of Y.PALETTE[n]) {
              const b = el("button");
              b.type = "button";
              b.dataset.c = c;
              b.title = c;
              b.style.background = c;
              b.onclick = () => {
                free.value = c;
                set(c);
              };
              row.append(b);
            }
            free.oninput = () => set(free.value);
            row.append(free);
            mark();
            inn.append(el("h3", null, t), row);
          });
          const params = el("div", "ys-params");
          for (const [q, t, lo, hi] of Y.PARAMS) {
            const r = el("input");
            r.type = "range";
            r.min = lo;
            r.max = hi;
            r.step = 0.05;
            r.value = cfg.p[k][q];
            r.setAttribute("aria-label", `${K.name}の ${t}`);
            r.oninput = () => {
              cfg.p[k][q] = Number(r.value);
              keep();
            };
            params.append(el("label", null, t), r);
          }
          inn.append(el("h3", null, "うごき"), params);
          pane.yousei.append(one);
        }
        pane.yousei.append(el("h2", null, "きぶんを ためす"), moods);
        const ctrl = Y.mount(stage, {cfg, names: true, onGive: c => Y.save(c), spots: () => [...tiles.children], mood: () => mi}); // プレビューには、チェックした子が 名札つきで出る
        ctrl.mood(0);
        Y.tray(trayBox, ctrl);
      })
      .catch(() => pane.yousei.append(el("div", "empty", "ようせいさんの部品を読みこめませんでした。")));

    /* 👪 かぞく: ひとりで 使う か ふたりで 使う か、名前、色。押したら すぐ 覚える(api/ui の people。ふたりの 版で 同じ) */
    {
      const box = el("div"),
        q = el("button", "q", "？"),
        hd = el("h2", null, "つかう 人 "),
        help = el("p", "sub");
      q.type = "button";
      q.setAttribute("aria-label", "説明");
      help.textContent =
        "📝 ホワイトボード・✅ やること などで「だれの」「だれが 書いた」に 出る 名前と 色です。ふたりで 使う ときは、もう ひとりの 画面でも 同じ 名前と 色に なります。色を えらばなければ、いまの 色の まま です。えらんだ 色を もう一度 押すと、もとに 戻ります。";
      help.hidden = true;
      q.onclick = () => {
        help.hidden = !help.hidden;
      };
      hd.append(q);
      const savePeople = async (body, msg) => {
        try {
          const r = await fetch("api/ui", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({people: body})});
          if (!r.ok) throw 0;
          I.shell.ui = await r.json();
          peopleLook();
          toast(msg || "覚えました");
        } catch (e) {
          toast("覚えられませんでした");
        }
        drawPeople(true);
      };
      const drawPeople = force => {
        const pp = I.shell.ui.pp || {ari: {t: "わたし"}, kazeo: {t: "あいて"}},
          pal = I.shell.ui.palette || {},
          dark = document.documentElement.dataset.theme === "dark";
        if (!force && box.contains(document.activeElement) && document.activeElement.tagName === "INPUT")
          return; /* 書いて いる 途中は 描き直さない */
        box.textContent = "";
        const seg = el("div", "seg2");
        for (const [v, t] of [
          [true, "ひとりで"],
          [false, "ふたりで"],
        ]) {
          const b = el("button", !!pp.solo === v ? "on" : null, t);
          b.type = "button";
          const locked = !v && pp.onlySolo === true; /* ひとり だけで 使う 版(体験版)では ふたりで を えらべない。押すと そう 伝える */
          if (locked) b.classList.add("off");
          b.onclick = () =>
            locked
              ? toast("体験版では いまは 押せません(ひとり だけで 使えます)")
              : savePeople({solo: v}, v ? "ひとりで 使う 形に しました" : "ふたりで 使う 形に しました");
          seg.append(b);
        }
        const top = el("div", "box pprow");
        top.append(el("span", "nm", "つかう 人数"), seg);
        box.append(top);
        for (const [k, lab] of [
          ["ari", "ひとりめ"],
          ["kazeo", "ふたりめ"],
        ]) {
          if (k === "kazeo" && pp.solo) continue;
          const c = el("div", "box ppone"),
            name = el("input"),
            sw = el("div", "ppsw");
          name.value = pp[k].t;
          name.maxLength = 12;
          name.autocomplete = "off";
          name.setAttribute("aria-label", lab + " の 名前");
          name.onchange = () => {
            const t = name.value.trim();
            if (t && t !== pp[k].t) savePeople({[k]: {t}}, `${lab}を「${t}」に しました`);
          };
          for (const [id, col] of Object.entries(pal)) {
            const b = el("button", pp[k].c === id ? "on" : null),
              other = pp[k === "ari" ? "kazeo" : "ari"];
            b.type = "button";
            b.style.background = col[dark ? 1 : 0];
            if (!pp.solo && other && other.c === id) {
              b.disabled = true; /* もう ひとりが えらんだ 色は えらべない(色が かぶると 見分けられない) */
              b.title = "もう ひとりが 使って いる 色";
            }
            b.setAttribute("aria-label", "色 " + id);
            b.onclick = () => savePeople({[k]: {c: pp[k].c === id ? "" : id}}, "色を 変えました");
            sw.append(b);
          }
          c.append(el("div", "pplab", lab), name, sw);
          box.append(c);
        }
      };
      pane.people.append(hd, help, box);
      drawPeople();
    }
    /* 🔗 れんけい(さいごの タブ。): どの アプリが どこと つながって いるか。れんけい先・利用アプリ・れんけい情報・設定の 詳細へ(api/links。見る だけ) */
    {
      const box = el("div", "lkrows"),
        hd = el("div", "lkhd"),
        q = el("button", "q", "？"),
        help = el("p", "sub"),
        sortB = el("button", "srt");
      help.textContent = "アプリが つながって いる 相手の 一覧です。つなぐ・外す は「設定へ」から、その アプリの ⚙️ で。";
      help.hidden = true;
      q.type = sortB.type = "button";
      q.setAttribute("aria-label", "説明");
      q.onclick = () => {
        help.hidden = !help.hidden;
      };
      /* 並び: アプリの 順 / れんけい中が 先 / 未れんけいが 先(この 端末で 覚える) */
      const SORTS = [
        ["app", "↕ アプリの 順"],
        ["on", "↕ れんけい中が 先"],
        ["off", "↕ 未れんけいが 先"],
      ];
      let rows = [],
        sort = "app";
      try {
        const v = localStorage.getItem(LS("gojiai-links-sort"));
        if (SORTS.some(x => x[0] === v)) sort = v;
      } catch (e) {}
      const paint = () => {
        sortB.textContent = SORTS.find(x => x[0] === sort)[1];
        const list =
          sort === "app" ? rows : rows.slice().sort((x, y) => (sort === "on" ? y.ok - x.ok : x.ok - y.ok)); /* 同じ なら もとの 順の まま */
        box.textContent = "";
        if (!list.length) box.append(el("div", "box empty", "いまは ありません。"));
        for (const r of list) {
          const c = el("div", "box lkrow"),
            top = el("div", "hd"),
            st = el("span", "st" + (r.ok ? " ok" : ""), r.ok ? "✓ れんけい中" : "未れんけい");
          const go = el("a", "go", "設定へ ›");
          go.href = r.go;
          top.append(el("b", null, r.to), st);
          c.append(top, el("div", "info", `アプリ: ${r.e} ${r.app}` + (r.info ? " ・ " + r.info : "")), go);
          box.append(c);
        }
      };
      sortB.onclick = () => {
        sort = SORTS[(SORTS.findIndex(x => x[0] === sort) + 1) % SORTS.length][0];
        try {
          localStorage.setItem(LS("gojiai-links-sort"), sort);
        } catch (e) {}
        paint();
      };
      hd.append(q, sortB);
      pane.links.append(hd, help, box);
      const drawLinks = async () => {
        try {
          rows = (await (await fetch("api/links", {cache: "no-store"})).json()).links || [];
        } catch (e) {
          box.textContent = "つながりませんでした。Tailscale を見てください";
          return;
        }
        paint();
      };
      tab.links.addEventListener("click", drawLinks);
      if (location.hash === "#links") drawLinks();
    }
    /* 💾 控え: 毎晩 4:10 に この PC の 中へ 自動で 取る(apps/backup.py)。ここは さいごの 日時を 出す だけ(ボタンは 無い) */
    const bk = el(
      "p",
      "sub",
      I.shell.ui.backup
        ? "💾 さいごの 控え: " + I.shell.ui.backup.slice(5).replace("-", "/") + "(毎晩 自動)"
        : "💾 控えは まだ ありません(毎晩 4 時すぎに 自動で 取ります)",
    );
    bk.className = "sub bk";
    const again = el("button", "btn", "🔰 はじめての しつもんを もう一度");
    again.type = "button";
    again.onclick = async () => {
      try {
        const r = await fetch("api/tut", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({again: true})});
        if (!r.ok) throw 0;
        location.href = "./#tut";
      } catch (e) {
        toast("はじめられませんでした");
      }
    };
    /* ℹ️ このアプリ(さいごの タブ。): はじめての しつもん と 控え を 左寄せの 見出しで */
    const frame = (...kids) => {
      const b = el("div", "box lite-sec");
      b.append(...kids);
      return b;
    };
    pane.about.append(...qh("🔰 はじめての しつもん", "いまの 設定に 上書き されます。"), frame(again), el("h2", null, "💾 控え"), frame(bk));
    walls();
    show(location.hash === "#widget" ? "wall" : TABS.some(t => "#" + t[0] === location.hash) ? location.hash.slice(1) : "apps");
  };
})();
