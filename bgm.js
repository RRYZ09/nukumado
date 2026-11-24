// 🎵 きょく(BGM)を どのアプリからも流す部品。apps/bgm.py。入れる・名前・けす は 🍵 ひといき の「🎵 きょく」(hitoiki-kyoku.html)
// つかいかた: await BGM.load(); BGM.play(); … BGM.stop();  BGM.next() で つぎの曲(名前を返す)。BGM.ding(880) で ポン
// 「ひだまり」は その場で作る和音(ファイルなし・外から読まない)。ほかは 持ち主が入れた曲(data/bgm/)。曲は くりかえす
const BGM = (() => {
  let D = {songs: [], first: "hidamari"},
    cur = null,
    AC = null,
    M = null,
    DG = null,
    iv = null,
    au = null,
    auId = null;
  const LK = "gojiai-bgm-cur"; // この端末で さいごに 🔀 で選んだ曲
  const HIDAMARI = {
    ch: [
      [261.6, 329.6, 392, 493.9],
      [220, 261.6, 329.6, 392],
      [174.6, 220, 261.6, 329.6],
      [196, 246.9, 293.7, 392],
    ],
    bar: 3,
    pat: [0, 1, 2, 3, 2, 1],
    arp: "triangle",
    up: 2,
  };

  let DAY = {}; // きょうの 曲の きぶん は サーバーに(api/hitoiki/day。どの 端末でも 同じ。)
  async function load() {
    const [a, b] = await Promise.all([
      fetch("api/bgm", {cache: "no-store"}).catch(() => null),
      fetch("api/hitoiki/day", {cache: "no-store"}).catch(() => null),
    ]);
    try {
      if (a && a.ok) D = await a.json();
    } catch (e) {}
    try {
      if (b && b.ok) DAY = await b.json();
    } catch (e) {}
    try {
      const v = localStorage.getItem(MK());
      if (v && !(DAY.mood && DAY.mood.d === today())) setMood(+v);
      localStorage.removeItem(MK());
    } catch (e) {} // この 端末だけに 覚えていたものは 1 回 うつす
    const ids = tracks().map(t => t.id);
    let c = null;
    try {
      c = localStorage.getItem(LK);
    } catch (e) {}
    if (!cur || !ids.includes(cur)) cur = ids.includes(c) ? c : ids.includes(D.first) ? D.first : "hidamari";
    return D;
  }
  // 曲ごとの「どのタイマーで(use)」「どういうとき(lv)」。use が 空の曲は タイマーでは 流さない(入れただけでは どれにも入れない)。lv が 空なら いつでも
  // BGM.use({mode, lv}) で いまの場面を決めると、play・next は 合う曲から。合う曲が なければ ひだまり。use(null) なら ぜんぶ
  let ctx = null;
  const any = (a, v) => !a || !a.length || v == null || a.includes(v); // 曲の側が 空 か、場面の側が 決まっていなければ 合う
  const hset = () => !!(D.hidamari && D.hidamari.use && D.hidamari.use.length); // ひだまり に タイマーを 決めたら ほかの曲と 同じに あつかう。決めていなければ いつでも(合う曲が 無いときの かわり)
  // きぶん ごとに 流してよい きぶん(左ほど 先に 選ぶ)。: しずかに は しずかに だけ、ふつう までは 下(しずか)へ、上げる ときは ふつう まで
  const ALLOW = {1: [1], 2: [2, 1], 3: [3, 2, 1], 4: [4, 3], 5: [5, 4, 3]};
  const rank = t => {
    if (!ctx || ctx.mood == null || !t.mood || !t.mood.length) return 0;
    const a = ALLOW[ctx.mood] || [ctx.mood];
    const r = Math.min(
      ...t.mood.map(m => {
        const i = a.indexOf(m);
        return i < 0 ? 99 : i;
      }),
    );
    return r;
  };
  const fits = t => !ctx || (t.id === "hidamari" && !hset()) || ((t.use || []).includes(ctx.mode) && any(t.lv, ctx.lv) && rank(t) < 99);
  // きぶん 1 しずかに 〜 5 テンション上げる / null どれでも。その日のあいだ この端末で 覚える(⏱️ タイマー の ボタン)
  const MK = () => "gojiai-bgm-mood:" + new Date().toLocaleDateString("sv");
  const today = () => new Date().toLocaleDateString("sv");
  function mood() {
    const s = DAY.mood;
    return s && s.d === today() ? s.v : 2;
  } // 決めていない日は 2 落ち着く
  function setMood(v) {
    DAY = {...DAY, mood: v ? {d: today(), v} : undefined};
    fetch("api/hitoiki", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({day: {k: "mood", d: today(), v: v || null}}),
    }).catch(() => {});
  }
  // 📦 しまった曲(arc)は 出さない・流さない
  const tracks = only => {
    const all = [{...(D.hidamari || {}), id: "hidamari", n: (D.hidamari && D.hidamari.n) || "ひだまり"}, ...D.songs.filter(t => !t.arc)];
    if (!only) return all;
    const f = all.filter(fits);
    return f.length ? f : [all[0]];
  };
  function use(c) {
    // c = {mode: "brush" | "yoga" | "breath" | "song", lv: 0 | 1 | 2, mood?: きぶん(なければ その日の きぶん)} / null
    if (c && c.mood === undefined) c = {...c, mood: mood()};
    ctx = c;
    const ts = tracks(true),
      mine = c ? ts.filter(t => t.id !== "hidamari" || hset()) : ts;
    const pool = mine.length ? mine : ts,
      best = Math.min(...pool.map(rank)),
      top = pool.filter(t => rank(t) === best).map(t => t.id); // いちばん 先の きぶん の 曲から
    if (top.includes(cur)) return;
    cur = top.includes(D.first) ? D.first : top[Math.floor(Math.random() * top.length)];
  }
  // 音の大きさを そろえる: サーバーが 測った 曲の大きさ(lufs)から、-14 LUFS あたりで 同じに聞こえるように 音量を下げる(上げるのは 1 まで)
  const vol = id => {
    if (D.norm === false) return 0.7;
    const t = D.songs.find(s => s.id === id);
    return t && typeof t.lufs === "number" ? Math.max(0.05, Math.min(1, 0.7 * Math.pow(10, (-14 - t.lufs) / 20))) : 0.7;
  };
  const name = () => (tracks().find(t => t.id === cur) || {n: ""}).n;

  function ac() {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    AC.resume();
    if (!M) {
      M = AC.createGain();
      M.gain.value = 0;
      const lp = AC.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      M.connect(lp);
      lp.connect(AC.destination);
      DG = AC.createGain();
      DG.gain.value = 0.5;
      DG.connect(AC.destination);
    }
  }
  function tone(f, t0, dur, type, vol, out = M) {
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(out);
    o.start(t0);
    o.stop(t0 + dur + 0.1);
  }

  function stop() {
    clearInterval(iv);
    iv = null;
    if (M && AC) M.gain.setTargetAtTime(0, AC.currentTime, 0.3);
    if (au) au.pause(); // 同じ曲を また play すると つづきから
  }
  function play(id) {
    if (id) cur = id;
    if (!cur) cur = "hidamari";
    stop();
    if (cur === "hidamari") {
      try {
        ac();
      } catch (e) {
        return false;
      }
      M.gain.cancelScheduledValues(AC.currentTime);
      M.gain.setTargetAtTime(0.5, AC.currentTime, 0.4);
      const U = HIDAMARI,
        stp = U.bar / U.pat.length;
      let bar = 0;
      const one = () => {
        const t = AC.currentTime + 0.05,
          c = U.ch[bar % 4];
        c.forEach(f => tone(f / 2, t, U.bar * 1.2, "sine", 0.05));
        U.pat.forEach((n, j) => tone(c[n] * U.up, t + j * stp, 1.6, U.arp, 0.025));
        bar++;
      };
      one();
      iv = setInterval(one, U.bar * 1000);
      return true;
    }
    if (!au || auId !== cur) {
      if (au) au.pause();
      au = new Audio("api/bgm/" + cur);
      au.loop = true;
      auId = cur;
    }
    au.volume = vol(cur);
    au.play().catch(() => {
      if (window.G) G.toast("曲を ながせませんでした");
    });
    return true;
  }
  function next() {
    const ts = tracks(true)
        .map((t, i) => [rank(t), i, t])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1])
        .map(x => x[2]),
      k = ts.findIndex(t => t.id === cur); // 🔀 は 先の きぶん から 順に
    cur = ts[(k + 1) % ts.length].id;
    try {
      localStorage.setItem(LK, cur);
    } catch (e) {}
    return name();
  }
  function ding(f = 880, v = 0.06) {
    try {
      ac();
      tone(f, AC.currentTime + 0.02, 0.9, "sine", v, DG);
    } catch (e) {}
  }
  // その きぶん に 印のある曲の数(しまった曲は 数えない。ひだまり も 入れる)
  const moodCount = v => tracks().filter(t => (t.mood || []).includes(v)).length;
  const allow = v => ALLOW[v] || [v];
  return {
    load,
    tracks,
    use,
    mood,
    setMood,
    moodCount,
    allow,
    play,
    stop,
    next,
    ding,
    get cur() {
      return cur;
    },
    get name() {
      return name();
    },
    get data() {
      return D;
    },
  };
})();
