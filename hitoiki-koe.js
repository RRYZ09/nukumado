// 🎙️ ひといき の こえ: タイマーの ことばを 読み上げる(apps/hitoiki_koe.py が ElevenLabs で 1 回だけ 作って 置いたもの)。
// 作っていない ことば は だまっている。⚙️ ではなく 🎙️ こえ の ページで 声を えらんで 作る
window.KOE =
  window.KOE ||
  (() => {
    // window に置く(hitoiki.js が あとから 読みこむので 2 回 読まれても 1 つ)
    const END = "おつかれさまでした";
    const BR = ["すって", "ゆっくり はいて"];
    // くわしく の 呼吸の ひとこと(web/hitoiki.js の 呼吸の hint と 同じ文)。はじめの 2 回だけ 読む(あとは すって・はいて だけ)
    const BRH = ["おなかが ふくらむのを感じて", "ろうそくを ゆらすくらいの 細い息で"],
      BRN = 2;
    let S = null,
      au = null;
    // 読み上げ用に(apps/hitoiki_koe.py の clean と同じ): すきまを 1 つに、日本語の間の すきまは とる、・ は 、
    const clean = t =>
      String(t || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120)
        .replace(/(?<=[^\x00-\x7f]) (?=[^\x00-\x7f])/g, "")
        .replace(/・/g, "、");
    // 読みかたは 2 つ: さいてい(min) = 区切りの 名前だけ、くわしく(full) = 下の 小さい字の ひとことまで
    const full = lv => (lv || (S && S.level) || "min") === "full";
    const step = (s, lv) => clean(s.t + (full(lv) && s.sub ? "。" + s.sub : ""));
    const breath = (i, lv) => clean(BR[i] + (full(lv) ? "。" + BRH[i] : ""));
    function lines(def, lv) {
      // そのタイマーで 読む ことば(同じものは 1 回)。くわしく の 呼吸は 3 回目から さいてい なので 両方
      const out = def.breath ? (full(lv) ? [breath(0, lv), breath(1, lv), ...BR] : [...BR]) : def.steps.map(s => step(s, lv));
      out.push(END);
      return [...new Set(out.map(clean))];
    }
    async function load(full) {
      try {
        const r = await fetch("api/hitoiki/koe" + (full ? "" : "?lite=1"), {cache: "no-store"});
        if (r.ok) S = await r.json();
      } catch (e) {}
      return S;
    }
    function url(t) {
      const h = S && S.have[clean(t)];
      return h ? "api/hitoiki/koe/" + h + ".mp3" : "";
    }
    function play(u) {
      stop();
      if (!u) return null;
      au = new Audio(u);
      au.play().catch(() => {});
      return au;
    }
    function say(t, alt) {
      if (S && S.on) play(url(t) || (alt ? url(alt) : ""));
    } // タイマーから。こえ が「出す」で、作ってあるときだけ(無ければ alt)
    const sayStep = s => say(step(s), step(s, full() ? "min" : "full")); // くわしく が まだ なら さいてい を(逆も)
    const sayBreath = (inh, n) => {
      const i = inh ? 0 : 1;
      if (full() && n < BRN) say(breath(i), BR[i]);
      else say(BR[i]);
    };
    function stop() {
      if (au) {
        au.pause();
        au = null;
      }
    }
    // タイマーを えらぶ 画面(いま・タイマー・ヨガ)の 上に 置く トグルスイッチ 1 つ: 🗣️ 読み上げ(声を えらんでいない ときは 出さない)
    function bar(compact) {
      // compact: 「🗣️」と スイッチだけ(ほかと 1 行に 並べる とき)
      if (!document.getElementById("koe-css")) {
        const st = document.createElement("style");
        st.id = "koe-css";
        st.textContent =
          '.kbar{display:flex;justify-content:flex-end;margin:0 0 10px}.kbar label{display:flex;align-items:center;gap:8px;font:700 14px var(--head);color:var(--sub);cursor:pointer}.kbar input{position:absolute;opacity:0;width:1px;height:1px}.kbar .sw{width:46px;height:28px;border-radius:999px;background:var(--line);position:relative;transition:background .2s}.kbar .sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s}.kbar input:checked+.sw{background:var(--teal)}.kbar input:checked+.sw::after{transform:translateX(18px)}.kbar input:focus-visible+.sw{outline:2px solid var(--teal);outline-offset:2px}';
        document.head.append(st);
      }
      const b = document.createElement("div");
      b.className = "kbar";
      b.hidden = true;
      const draw = () => {
        b.textContent = "";
        b.hidden = !S || !S.voice;
        if (b.hidden) return;
        const l = document.createElement("label"),
          i = document.createElement("input"),
          sw = document.createElement("span");
        i.type = "checkbox";
        i.setAttribute("role", "switch");
        i.checked = !!S.on;
        sw.className = "sw";
        l.append("読む", i, sw);
        l.title = "タイマーで 読み上げる";
        b.append(l); //: 🗣️ より「読む」の字
        i.onchange = () => {
          S = {...S, on: i.checked};
          if (!S.on) stop();
          G.toast(S.on ? "🗣️ 読み上げます" : "🗣️ 読み上げを 止めました");
          fetch("api/hitoiki/koe", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({on: S.on})}).catch(() => {});
        };
      };
      if (S) draw();
      else load(false).then(draw);
      return b;
    }
    return {
      END,
      BR,
      clean,
      step,
      breath,
      lines,
      sayStep,
      sayBreath,
      bar,
      load,
      url,
      play,
      say,
      stop,
      get S() {
        return S;
      },
      set S(v) {
        S = v;
      },
    };
  })();
