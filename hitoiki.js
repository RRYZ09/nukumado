// 🍵 ひといき: いま(1 つだけ出す)・たな(好きなもの)・タイマー(歯みがき・ヨガ・呼吸)。apps/hitoiki.py
// やった回数は数えない。げんき は からだ から(押すと その日だけ変わる。この端末に覚える)
const HK = (() => {
  const {$, el} = G;
  const LVN = [
    ["🌙", "ぐったり"],
    ["☁️", "びみょう"],
    ["☀️", "げんき"],
  ]; // まん中は びみょう
  const day = () => new Date(Date.now() - 4 * 3600e3).toLocaleDateString("sv"); // 1 日の区切りは 朝 4 時(この 端末の 時刻で。前は UTC で 昼に 変わっていた)
  const LK = "hitoiki-lv:" + day();
  let D = null;

  async function load() {
    BGM.load();
    koe();
    try {
      const r = await fetch("api/hitoiki", {cache: "no-store"});
      if (!r.ok) throw 0;
      D = await r.json();
    } catch (e) {
      G.toast("つながりませんでした。Tailscale を見てください");
      D = null;
    }
    return D;
  }
  async function send(body, msg) {
    try {
      const r = await fetch("api/hitoiki", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
      const j = await r.json();
      if (!r.ok) {
        G.toast(j.error || "できませんでした");
        return null;
      }
      D = j;
      if (msg) G.toast(msg);
      return D;
    } catch (e) {
      G.toast("つながりませんでした");
      return null;
    }
  }
  // げんき を 自分で えらんだ日は サーバーに(どの 端末でも 同じ。)。前に この 端末だけに 覚えていたものは 1 回 うつす
  function lv() {
    const s = D && D.day && D.day.lv;
    if (s && s.d === day())
      return {lv: s.v, why: ""}; /* 自分で えらんだ日は 何も 書かない */
    try {
      const v = localStorage.getItem(LK);
      if (v !== null && D) {
        setLv(+v);
        localStorage.removeItem(LK);
        return {lv: +v, why: ""};
      }
    } catch (e) {}
    return D ? D.genki : {lv: 1, why: ""};
  }
  function setLv(v) {
    if (D) D.day = {...(D.day || {}), lv: {d: day(), v}};
    fetch("api/hitoiki", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({day: {k: "lv", d: day(), v}})}).catch(
      () => {},
    );
  }
  function koe() {
    // 🎙️ こえ(web/hitoiki-koe.js)。作ってある ことば だけ 区切りで 読む
    if (window.KOE) return KOE.load(false);
    const s = document.createElement("script");
    s.src = "hitoiki-koe.js";
    s.onload = () => KOE.load(false);
    document.head.append(s);
  }
  const say = t => {
    if (window.KOE) KOE.say(t);
  };
  // ⚙️ で えらんだ ページの 並び・出すか を タブの 列に(いま 開いている タブ と ⚙️ は 隠さない)。どの ページでも 1 回
  function tabs(u) {
    const t = (u && u.tabs) || {order: [], hide: []},
      box = document.querySelector("header #tabs");
    if (!box) return void requestAnimationFrame(() => tabs(u));
    const idOf = a => (a.getAttribute("href") || "").replace(/\.html.*$/, ""),
      at = id => {
        const i = t.order.indexOf(id);
        return i < 0 ? 1e6 : i;
      };
    const as = [...box.querySelectorAll("a.tab")],
      fixed = as.map(idOf);
    as.sort((a, b) => at(idOf(a)) - at(idOf(b)) || fixed.indexOf(idOf(a)) - fixed.indexOf(idOf(b)));
    for (const a of as) {
      a.style.display = t.hide.includes(idOf(a)) && !a.classList.contains("on") ? "none" : "";
      box.append(a);
    }
  }
  fetch("api/hitoiki", {cache: "no-store"})
    .then(r => (r.ok ? r.json() : null))
    .then(j => {
      if (j) {
        if (!D) D = j;
        tabs(j.ui);
      }
    })
    .catch(() => {});
  koe(); // タイマー・ヨガの ページは load を呼ばないので ここでも
  const CE = () => Object.fromEntries((D ? D.cats : []).map(c => [c[0], c]));

  // ---- タイマー ----
  // 歯みがき: ひと筆がき(上の外 右→左、上の内 左→右、下も同じ)。z = [上下, 右・前・左, 外・内]。絵は 鏡と同じ向き(自分の右 = 画面の右)
  // 3分 = 1か所 15秒、5分 = 25秒。おわったら ご自愛の スタンプ(cards.json の r2 歯をみがく)を押せる
  const STAMP = {e: "🪥", t: "歯をみがく", k: "neru", src: "hitoiki", card: "r2"};
  const BR = brushRoute();
  function brushRoute() {
    // 片がわ = おく歯 2 本(o)・その手前 2 本(t)、まん中 = 前歯 6 本(f。犬歯まで)。上下とも 外 5 → 内 5 → かむところ 右・左
    const N = {ro: "右の おく歯", rt: "右の おく歯の手前", f: "前歯", lt: "左の おく歯の手前", lo: "左の おく歯"},
      out = [];
    for (const j of ["u", "l"]) {
      const J = j === "u" ? "上の " : "下の ";
      for (const z of ["ro", "rt", "f", "lt", "lo"])
        out.push({t: J + N[z] + "・外がわ", sub: z === "f" ? "歯と歯ぐきの さかい目" : "", z: [j, z, "o"]});
      for (const z of ["lo", "lt", "f", "rt", "ro"])
        out.push({
          t: J + N[z] + "・" + (z === "f" ? "うら" : "内がわ"),
          sub: z === "f" ? (j === "l" ? "たてにして。よごれが たまりやすいところ" : "歯ブラシを たてにして") : "",
          z: [j, z, "i"],
        });
      out.push(
        {t: J + "右の かむところ", sub: "おく歯と その手前を 前後に", z: [j, "r", "k"]},
        {t: J + "左の かむところ", sub: j === "l" ? "おわったら ぶくぶく" : "つぎは 下の歯", z: [j, "l", "k"]},
      );
    }
    return out;
  }
  const MEISO = total =>
    [
      ["すわる", "背中を すっと、肩の 力を ぬく", 30],
      ["息に 気づく", "鼻から 入って 出ていく 息を 感じる", 60],
      ["からだを 感じる", "頭から 足まで、ゆっくり 注意を おろす", 60],
      ["音に 気づく", "近くの 音、遠くの 音。聞こえるまま", 60],
      ["考えが 浮かんだら", "「考えた」と 気づいて、息に もどる", 60],
      ["ゆっくり もどる", "指先を 動かして、目を あける", 30],
    ].map(([t, sub, s]) => ({t, sub, s: (s * total) / 300, pose: "meiso"}));
  const TM = {
    brush: {e: "🪥", n: "歯みがき ささっと", d: "3分", music: true, mouth: true, stamp: STAMP, steps: BR.map(x => ({...x, s: 180 / BR.length}))},
    brush5: {e: "🪥", n: "歯みがき じっくり", d: "5分", music: true, mouth: true, stamp: STAMP, steps: BR.map(x => ({...x, s: 300 / BR.length}))},
    yoga5: {
      e: "🧘",
      n: "床ヨガ(首・肩コース)",
      d: "5分",
      music: true,
      pose: true,
      steps: [
        {t: "首を ゆっくり まわす", sub: "右に3回、左に3回。いたくないところまで", s: 50, pose: "neck"},
        {t: "肩を すくめて ストン", sub: "すって すくめて、はいて 落とす", s: 50, pose: "shrug"},
        {t: "ねこ と うし", sub: "四つんばいで、背中を まるめる ↔ そらす", s: 50, pose: "catcow"},
        {t: "子どものポーズ", sub: "おしりを かかとに。おでこを床に", s: 50, pose: "child"},
        {t: "すわって 前に たおれる", sub: "ひざは まげていい。吐く息で 少しずつ", s: 50, pose: "fold"},
        {t: "あおむけで ひざを かかえる", sub: "左右に ゆらゆら", s: 50, pose: "hug"},
      ],
    },
    // ぜんぶ: 首・肩 から 3 つ、足・こし から 3 つ を はじめるたびに えらぶ(同じポーズは 1 回)。50 秒ずつ 5 分。並びは 座る → 四つんばい → 寝る
    yukaAll: {e: "🧘", n: "床ヨガ(ぜんぶコース)", d: "5分", music: true, pose: true, mix: ["yoga5", "yuka"], steps: []},
    isu: {
      e: "🪑",
      n: "いすヨガ(全身コース)",
      d: "5分",
      music: true,
      pose: true,
      steps: [
        {t: "両手を 上に のびる", sub: "すって のびて、はいて おろす", s: 50, pose: "c_up"},
        {t: "首を 横に たおす", sub: "耳を 肩に 近づける。右に 20びょう → 左に 20びょう", s: 50, pose: "c_tilt"},
        {t: "体を ひねる", sub: "背もたれに 手を かけて、右 → 左", s: 50, pose: "c_twist"},
        {t: "背中を まるめる ↔ そらす", sub: "手は ひざに。すって そらす、はいて まるめる", s: 50, pose: "c_catcow"},
        {t: "足首を まわす", sub: "片足ずつ 前に のばして くるくる", s: 50, pose: "c_ankle"},
        {t: "すわったまま 前に たおれる", sub: "おなかを ももに。手は 床へ ぶらん", s: 50, pose: "c_fold"},
      ],
    },
    yuka: {
      e: "🧘",
      n: "床ヨガ(足・こしコース)",
      d: "5分",
      music: true,
      pose: true,
      steps: [
        {t: "ちょうちょ", sub: "足のうらを 合わせて、ひざを パタパタ", s: 60, pose: "x_bfly"},
        {t: "片足ずつ 前に たおれる", sub: "片足は のばして、片足は まげて。右足 30びょう → 左足 30びょう", s: 60, pose: "x_janu"},
        {t: "ねじりのポーズ", sub: "右に ねじる → 左に", s: 60, pose: "n_twist"},
        {t: "すわって 前に たおれる", sub: "ひざは まげていい。吐く息で 少しずつ", s: 60, pose: "fold"},
        {t: "子どものポーズ", sub: "おでこを床に。ゆっくり 息をする", s: 60, pose: "child"},
      ],
    },
    katakori: {
      e: "🪑",
      n: "いすヨガ(肩こりコース)",
      d: "5分",
      music: true,
      pose: true,
      steps: [
        {t: "肩を まわす", sub: "上 → うしろ → 下 → 前 へ 大きく", s: 50, pose: "x_roll"},
        {t: "胸を ひらく", sub: "いすの うしろで 手を くんで", s: 50, pose: "x_cchest"},
        {t: "首を 横に たおす", sub: "耳を 肩に 近づける。右に 20びょう → 左に 20びょう", s: 50, pose: "c_tilt"},
        {t: "手首を まわす", sub: "うでを 前に のばして くるくる", s: 50, pose: "x_wrist"},
        {t: "かかとを 上げ下げ", sub: "つま先は 床に つけたまま", s: 50, pose: "x_heel"},
        {t: "片足 のばして 前に たおれる", sub: "ももの うらを のばす。右足 → 左足", s: 50, pose: "x_cham"},
      ],
    },
    nemae: {
      e: "🌙",
      n: "ふとんヨガ",
      d: "5分",
      music: true,
      pose: true,
      steps: [
        {t: "あおむけで ねじる", sub: "足のうらは 床のまま、両ひざを 右 → 左に たおす", s: 50, pose: "x_sptwist"},
        {t: "ハッピーベイビー", sub: "ひざを わきへ。足のうらを 天井に向けて もつ", s: 50, pose: "x_baby"},
        {t: "橋のポーズ", sub: "すって おしりを 上げる、はいて おろす", s: 50, pose: "x_bridge"},
        {t: "足を 壁に 上げる", sub: "足の つかれ・むくみに", s: 50, pose: "x_wall"},
        {t: "スフィンクス", sub: "うつぶせで ひじをついて 胸を 起こす", s: 50, pose: "x_sphinx"},
        {t: "あおむけで ねる", sub: "手足を ほどいて、ただ 息をする", s: 50, pose: "n_rest"},
      ],
    },
    yoga10: {
      e: "🌿",
      n: "立ってヨガ",
      d: "10分",
      music: true,
      pose: true,
      steps: [
        {t: "山のポーズ", sub: "立って、足のうらで 床をおす", s: 50, pose: "n_mt"},
        {t: "スワイショウ", sub: "足を 肩はばに。うでを 前後に ぶらぶら。ひざは やわらかく", s: 50, pose: "x_swai"},
        {t: "両手を上に のびる", sub: "すって のびて、はいて 横に たおす", s: 50, pose: "n_side"},
        {t: "木のポーズ", sub: "片足で すっと 立って、うでを 上に。右足 → 左足", s: 50, pose: "x_tree"},
        {t: "戦士のポーズ", sub: "足を 前後に ひらいて、うでを 横に。右 → 左", s: 50, pose: "x_warrior"},
        {t: "三角のポーズ", sub: "足を ひらいて、横に たおれる。右 → 左", s: 50, pose: "x_tri"},
        {t: "立って 前に たおれる", sub: "ひざは まげていい", s: 50, pose: "x_sfold"},
        {t: "ねこ と うし", sub: "背中を まるめる ↔ そらす", s: 50, pose: "catcow"},
        {t: "ダウンドッグ", sub: "ひざは まげたままでいい", s: 50, pose: "n_dog"},
        {t: "ねじりのポーズ", sub: "すわって、右に ねじる → 左に", s: 50, pose: "n_twist"},
        {t: "子どものポーズ", sub: "おでこを床に", s: 50, pose: "child"},
        {t: "あおむけで ねる", sub: "手足を ほどいて、ただ 息をする", s: 50, pose: "n_rest"},
      ],
    },
    breath: {
      e: "🌬️",
      n: "ゆっくり呼吸",
      d: "1分",
      music: false,
      breath: true,
      stamp: {e: "🌬️", t: "ゆっくり呼吸", k: "kibun", src: "hitoiki"},
      steps: [{t: "", sub: "", s: 60}],
    },
    // 🪷 瞑想: すわって 息 → からだ → 音 → 考え に 気づいて もどる。5 分 と 3 分(同じ 流れを 縮める)
    meiso: {e: "🪷", n: "瞑想", d: "5分", music: true, pose: true, meiso: true, steps: MEISO(300)},
    meiso3: {e: "🪷", n: "瞑想 みじかく", d: "3分", music: true, pose: true, meiso: true, steps: MEISO(180)},
    song: {e: "🎵", n: "1曲ぶん 休む", d: "4分", music: true, steps: [{t: "音を 聞くだけ", sub: "目を とじてもいい", s: 240}]},
    look: {e: "🪟", n: "遠くを 見る", d: "1分", music: false, steps: [{t: "窓の外の いちばん遠くを見る", sub: "空の色、雲、木の葉", s: 60}]},
  };
  const TORDER = ["brush", "breath", "yoga5", "isu", "yoga10", "nemae", "meiso", "song", "look"]; // yuka・katakori は 床ヨガ・いすヨガ の カードの中の コース

  // 音は web/bgm.js(ひだまり と 🎵 きょく に入れた曲)。区切りの ポン も
  const musicOn = () => BGM.play(),
    musicOff = () => BGM.stop(),
    nextTune = () => BGM.next(),
    ding = (f, v) => BGM.ding(f, v);

  // 口の絵(上から見た 歯ならび。上の歯は 上に、下の歯は 下に)。いまの所を 光らせて 🪥 を置く
  const JAW = {u: {cy: 132, a: [199, 341]}, l: {cy: 168, a: [19, 161]}},
    RX = 88,
    RY = 100,
    CX = 130;
  const rad = a => (a * Math.PI) / 180,
    pt = (j, a, d = 0) => [CX + (RX + d) * Math.cos(rad(a)), JAW[j].cy + (RY + d) * Math.sin(rad(a))];
  // 14 本ずつ(親知らずなし。)。片がわ = おく歯 2・手前(小臼歯)2・前歯 3(犬歯まで)。
  // 上は 画面の左(= 自分の左)から、下は 画面の右から 並ぶ
  const ZS = {u: ["lo", "lo", "lt", "lt", "f", "f", "f", "f", "f", "f", "rt", "rt", "ro", "ro"]};
  ZS.l = [...ZS.u].reverse();
  const WD = {o: 19, t: 14, f: 11};
  const TEETH = {};
  for (const j of ["u", "l"]) {
    const ws = ZS[j].map(z => WD[z === "f" ? "f" : z[1]]),
      sum = ws.reduce((x, y) => x + y, 0),
      [a0, a1] = JAW[j].a;
    let acc = 0;
    TEETH[j] = ws.map((w, k) => {
      const a = a0 + ((a1 - a0) * (acc + w / 2)) / sum;
      acc += w;
      return {a, w, z: ZS[j][k], lo: a0 + ((a1 - a0) * (acc - w)) / sum, hi: a0 + ((a1 - a0) * acc) / sum};
    });
  }
  const inZ = (z, tz) => z === tz || (z.length === 1 && z !== "f" && tz[0] === z); // "r" = 右の おく歯 + 手前(かむところ)
  const arcD = (j, a0, a1, d) => {
    let p = "";
    for (let k = 0; k <= 16; k++) {
      const [x, y] = pt(j, a0 + ((a1 - a0) * k) / 16, d);
      p += (k ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return p;
  };
  function mouthSvg() {
    let g = "",
      th = "";
    for (const j of ["u", "l"]) {
      const [a0, a1] = JAW[j].a;
      g += `<path d="${arcD(j, a0 - 4, a1 + 4, 0)}" fill="none" stroke="#F4C7C3" stroke-width="40" stroke-linecap="round" opacity=".75"/>`;
      for (const T of TEETH[j]) {
        const [x, y] = pt(j, T.a),
          w = T.w - 1.5,
          h = T.z === "f" ? 17 : 18;
        th += `<rect class="th" data-j="${j}" data-z="${T.z}" x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w}" height="${h}" rx="5" transform="rotate(${(T.a + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }
    }
    return (
      `<svg viewBox="-6 -18 272 336" aria-hidden="true">${g}<path class="band" d="" fill="none" stroke="var(--teal)" stroke-width="11" stroke-linecap="round"/>${th}<text class="brush" font-size="28" text-anchor="middle" dominant-baseline="central">🪥</text>` +
      `<text x="248" y="150" class="lr" text-anchor="end">みぎ</text><text x="12" y="150" class="lr">ひだり</text></svg>`
    );
  }
  function mouthAt(r, z) {
    const [j, zone, io] = z,
      ts = TEETH[j].filter(T => inZ(zone, T.z)),
      a0 = Math.min(...ts.map(T => T.lo)),
      a1 = Math.max(...ts.map(T => T.hi)),
      mid = (a0 + a1) / 2;
    const band = r.querySelector(".band"),
      k = io === "k";
    band.setAttribute("d", k ? "" : arcD(j, a0 + 1, a1 - 1, io === "o" ? 25 : -26)); // かむところ は 歯の上に 線を引かず、歯を こく光らせる
    const [x, y] = pt(j, mid, k ? 0 : io === "o" ? 38 : -46),
      b = r.querySelector(".brush");
    b.setAttribute("x", x.toFixed(1));
    b.setAttribute("y", y.toFixed(1));
    r.querySelectorAll(".th").forEach(t => {
      const on = t.dataset.j === j && inZ(zone, t.dataset.z);
      t.classList.toggle("on", on);
      t.classList.toggle("kamu", on && k);
    });
  }

  // ヨガの絵: ちびっこ(大きな頭・おだんご髪・ぽってりした体・短い手足)。上は みどり、下は あい色。ポーズごとに ゆっくり 動く(hitoiki.css の .pz-*)
  const HEAD = (x, y, side) =>
    `<g class="hd">` +
    (side
      ? `<circle cx="${x + 15}" cy="${y - 13}" r="7.5" class="hair"/><circle cx="${x}" cy="${y}" r="19" class="skin"/><path d="M${x - 17} ${y - 7} A19 19 0 0 1 ${x + 19} ${y + 1} Q${x + 6} ${y - 4} ${x + 4} ${y - 12} Q${x - 6} ${y - 6} ${x - 17} ${y - 7}Z" class="hair"/><path d="M${x - 11} ${y + 1} q3.5 3.5 7 0" class="eye"/><circle cx="${x - 6}" cy="${y + 9}" r="3.6" class="cheek"/>`
      : `<circle cx="${x}" cy="${y - 21}" r="7.5" class="hair"/><circle cx="${x}" cy="${y}" r="19" class="skin"/><path d="M${x - 19} ${y - 1} A19 19 0 0 1 ${x + 19} ${y - 1} Q${x + 10} ${y - 9} ${x} ${y - 7} Q${x - 10} ${y - 9} ${x - 19} ${y - 1}Z" class="hair"/><path d="M${x - 10} ${y + 2} q3.5 3.5 7 0 M${x + 3} ${y + 2} q3.5 3.5 7 0" class="eye"/><circle cx="${x - 11}" cy="${y + 9}" r="3.6" class="cheek"/><circle cx="${x + 11}" cy="${y + 9}" r="3.6" class="cheek"/>`) +
    `</g>`;
  const HEADR = (x, y) => `<g transform="translate(${2 * x} 0) scale(-1 1)">${HEAD(x, y, 1)}</g>`; // 横顔(右を向く)
  const UP = (x, y) => `<g transform="rotate(-90 ${x} ${y})">${HEADR(x, y)}</g>`; // あおむけ: 顔は 天井、頭の てっぺんは 体と 反対
  const MAT = `<rect x="22" y="166" width="196" height="10" rx="5" class="mat"/>`;
  const B = d => `<path d="${d}" class="bd"/>`,
    A = d => `<path d="${d}" class="arm"/>`,
    Lg = d => `<path d="${d}" class="leg"/>`,
    HN = (x, y) => `<circle cx="${x}" cy="${y}" r="6.5" class="skin"/>`;
  const SEAT = Lg("M106 148 L84 157 L118 163 M134 148 L156 157 L122 163") + B("M120 145 L120 116");
  const ARMS = A("M107 114 Q94 132 92 151 M133 114 Q146 132 148 151") + HN(92, 152) + HN(148, 152);
  const STAND =
    Lg("M112 130 L110 160 M128 130 L130 160") +
    `<ellipse cx="106" cy="163" rx="9" ry="5" class="ft"/><ellipse cx="134" cy="163" rx="9" ry="5" class="ft"/>`;
  const CH_F = `<rect x="94" y="86" width="52" height="50" rx="7" class="chair"/><rect x="84" y="132" width="72" height="9" rx="4" class="chair"/><rect x="88" y="140" width="7" height="26" rx="3" class="chair"/><rect x="145" y="140" width="7" height="26" rx="3" class="chair"/>`;
  const CH_S = `<rect x="148" y="84" width="8" height="50" rx="4" class="chair"/><rect x="96" y="132" width="60" height="8" rx="4" class="chair"/><rect x="100" y="139" width="6" height="27" rx="3" class="chair"/><rect x="146" y="139" width="6" height="27" rx="3" class="chair"/>`;
  const LEGS_F =
    Lg("M110 136 L108 160 M130 136 L132 160") +
    `<ellipse cx="106" cy="163" rx="8" ry="5" class="ft"/><ellipse cx="134" cy="163" rx="8" ry="5" class="ft"/>`;
  const ARMS_F = A("M108 106 Q98 122 104 134 M132 106 Q142 122 136 134") + HN(104, 135) + HN(136, 135);
  // 息に あわせて 動く ポーズ: 4 秒すって(a → b)・6 秒はいて(b → a)。呼吸タイマーと 同じ 速さ
  const IKI = (a, b) =>
    `<animate attributeName="d" dur="10s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.4;1" keySplines=".45 0 .55 1;.45 0 .55 1" values="${a};${b};${a}"/>`;
  const POSES = {
    neck: MAT + SEAT + ARMS + HEAD(120, 88),
    meiso: MAT + `<g class="mz">${SEAT}${ARMS}${HEAD(120, 88)}</g>`, // 🪷 すわって 目を とじる。息で からだが ほんの 少し ふくらむ
    shrug: MAT + SEAT + `<g class="sh">${ARMS}</g>` + HEAD(120, 88),
    catcow:
      MAT +
      Lg("M158 114 L162 160 L204 161") +
      `<path d="M82 114 Q120 134 158 114" class="bd"><animate attributeName="d" dur="6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1" values="M82 114 Q120 134 158 114;M82 112 Q120 80 158 112;M82 114 Q120 134 158 114"/></path>` +
      A("M84 116 L78 158") +
      HN(78, 160) +
      `<g class="hm">${HEAD(60, 104, 1)}</g>`,
    child:
      MAT +
      Lg("M206 162 L156 162 L190 146") +
      `<g class="bk">${B("M188 146 Q156 130 116 150")}${A("M118 152 L56 161")}${HN(52, 161)}${HEAD(96, 150, 1)}</g>`,
    fold:
      MAT +
      Lg("M156 156 Q108 150 56 158") +
      HN(52, 157) +
      `<g class="tr">${B("M156 152 L130 120")}${A("M134 124 L84 148")}${HN(81, 149)}${HEAD(118, 100, 1)}</g>`,
    hug:
      MAT +
      `<g class="rk">${B("M72 154 L128 154")}${Lg("M128 150 L108 118 L140 106")}${HN(143, 105)}${A("M88 148 L106 122")}${HN(107, 120)}${UP(50, 146)}</g>`,
    // 🌿 のびのびヨガ: 立つ・ダウンドッグ・ねじり・あおむけ(ねこ と うし・子どものポーズ は ゆるヨガ と同じ絵)
    n_mt:
      MAT +
      STAND +
      `<g class="br">${B("M120 130 L120 102")}${A("M108 100 Q102 118 104 132 M132 100 Q138 118 136 132")}${HN(104, 133)}${HN(136, 133)}${HEAD(120, 76)}</g>`,
    n_side:
      MAT +
      STAND +
      `<g class="sd">${B("M120 130 L120 102")}${A("M108 100 L104 58 M132 100 L136 58")}${HN(104, 55)}${HN(136, 55)}${HEAD(120, 76)}</g>`,
    n_dog:
      MAT +
      `<g class="dg">${Lg("M132 104 L176 160")}<ellipse cx="182" cy="163" rx="9" ry="5" class="ft"/>${B("M92 138 L130 106")}${A("M92 140 L74 160")}${HN(72, 162)}<g transform="rotate(-40 86 140)">${HEAD(86, 140, 1)}</g></g>`,
    // ねじり: 右に ひねった姿 ↔ 左に ひねった姿 を ふわっと 切りかえる(顔は ひねる方。片手は うしろの床、片手は ひざ)
    n_twist:
      MAT +
      SEAT +
      `<g class="sa">${A("M133 114 Q150 136 160 158 M107 114 Q118 136 146 152")}${HN(161, 160)}${HN(148, 153)}${HEADR(120, 88)}</g><g class="sb">${A("M107 114 Q90 136 80 158 M133 114 Q122 136 94 152")}${HN(79, 160)}${HN(92, 153)}${HEAD(120, 88, 1)}</g>`,
    n_rest:
      MAT +
      Lg("M148 158 L204 160 M148 154 L204 152") +
      `<g class="bt">${B("M72 156 L148 156")}</g>` +
      A("M88 160 L120 164 M88 150 L120 146") +
      UP(50, 148),
    // 🪑 いすヨガ: 前から見た いす(背もたれ・座面・脚)と、横から見た いす(顔は 左)
    c_up:
      CH_F +
      LEGS_F +
      B("M120 132 L120 110") +
      `<g class="up">${A("M108 106 L100 66 M132 106 L140 66")}${HN(100, 63)}${HN(140, 63)}</g>` +
      HEAD(120, 84),
    c_tilt: CH_F + LEGS_F + B("M120 132 L120 110") + ARMS_F + `<g class="tl">${HEAD(120, 84)}</g>`,
    c_twist:
      CH_F +
      LEGS_F +
      B("M120 132 L120 110") +
      `<g class="sa">${A("M132 106 Q146 98 146 90 M108 106 Q116 124 130 134")}${HN(146, 88)}${HN(132, 135)}${HEADR(120, 84)}</g><g class="sb">${A("M108 106 Q94 98 94 90 M132 106 Q124 124 110 134")}${HN(94, 88)}${HN(108, 135)}${HEAD(120, 84, 1)}</g>`,
    c_catcow:
      CH_S +
      Lg("M140 130 L98 130 L98 162") +
      `<ellipse cx="92" cy="163" rx="9" ry="5" class="ft"/>` +
      `<path d="M140 128 Q156 110 126 98" class="bd">${IKI("M140 128 Q156 110 126 98", "M140 128 Q126 112 132 94")}</path>` +
      A("M130 100 L102 124") +
      HN(100, 126) +
      `<g class="cm">${HEAD(122, 76, 1)}</g>`,
    c_ankle:
      CH_S +
      Lg("M140 130 L98 130 L98 162") +
      `<ellipse cx="92" cy="163" rx="9" ry="5" class="ft"/>` +
      Lg("M140 130 L104 128 L72 140") +
      `<g class="ak"><ellipse cx="66" cy="141" rx="9" ry="5" class="ft"/></g>` +
      B("M140 128 L134 96") +
      A("M134 100 L142 128") +
      HN(143, 130) +
      HEAD(128, 74, 1),
    c_fold:
      CH_S +
      Lg("M140 130 L98 130 L98 162") +
      `<ellipse cx="92" cy="163" rx="9" ry="5" class="ft"/>` +
      `<g class="cf">${B("M140 126 L104 112")}${A("M108 114 L96 156")}${HN(95, 159)}${HEAD(86, 112, 1)}</g>`,
  };
  // ---- 2026-11-23 に 足した ポーズ(ねる前・肩こり・床・立つ) ----
  const SMIL = (a, b, dur = 6) =>
    `<animate attributeName="d" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1" values="${a};${b};${a}"/>`;
  const FT = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" class="ft"/>`;
  const TREE =
    Lg("M118 122 L118 160") +
    FT(116, 163) +
    Lg("M124 122 L148 132 L122 138") +
    B("M120 122 L120 98") +
    A("M108 96 L98 60 M132 96 L142 60") +
    HN(97, 57) +
    HN(143, 57) +
    HEAD(120, 74);
  const TRI =
    Lg("M112 132 L80 160 M128 132 L162 160") +
    FT(76, 163) +
    FT(166, 163) +
    B("M120 130 L152 112") +
    A("M150 112 L164 148 M148 108 L136 66") +
    HN(165, 151) +
    HN(135, 62) +
    HEADR(170, 98);
  const WAR =
    Lg("M112 130 L78 160") +
    FT(74, 163) +
    Lg("M128 130 L156 138 L160 160") +
    FT(164, 163) +
    B("M120 130 L120 102") +
    A("M106 100 L66 100 M134 100 L174 100") +
    HN(62, 100) +
    HN(178, 100) +
    HEADR(120, 76);
  const CSEAT = Lg("M140 130 L98 130 L98 162") + FT(92, 163);
  Object.assign(POSES, {
    // 🌙 ねる前
    x_sptwist:
      MAT +
      A("M88 152 L66 166") +
      B("M72 154 L130 154") +
      `<path d="M130 152 L154 122 L180 160" class="leg">${SMIL("M130 152 L154 122 L180 160", "M130 152 L168 146 L182 162", 8)}</path>` +
      FT(186, 163) +
      UP(50, 146), // 足のうらは 床のまま、ひざが 横に たおれる
    x_baby:
      MAT +
      `<g class="rk">${B("M72 154 L124 154")}${Lg("M124 150 L104 122 L106 94")}<ellipse cx="106" cy="89" rx="10" ry="5" class="ft"/>${A("M88 150 L102 96")}${HN(103, 94)}${UP(50, 146)}</g>`, // ひざは わきの方へ、すねは まっすぐ上、足のうらは 天井
    x_bridge:
      MAT +
      `<path d="M76 158 Q110 156 140 150" class="bd">${IKI("M76 158 Q110 156 140 150", "M76 158 Q108 140 140 124")}</path>` +
      `<path d="M140 150 L172 122" class="leg">${IKI("M140 150 L172 122", "M140 124 L172 122")}</path>` +
      Lg("M172 122 L182 160") +
      FT(186, 163) +
      A("M86 160 L132 164") +
      UP(52, 152),
    x_wall:
      `<rect x="204" y="52" width="10" height="114" rx="3" class="chair"/>` +
      MAT +
      `<g class="bt">${B("M100 156 L186 156")}</g>` +
      Lg("M190 152 L192 76") +
      `<ellipse cx="194" cy="70" rx="5" ry="9" class="ft"/>` +
      A("M116 158 L140 166") +
      UP(78, 150),
    x_sphinx:
      MAT +
      Lg("M150 160 L208 162") +
      `<g class="bt">${B("M150 158 Q122 156 102 138")}${A("M106 142 L98 162 L70 162")}${HN(66, 162)}${HEAD(88, 116, 1)}</g>`,
    // 💻 肩こり(いす)
    x_roll:
      CH_S +
      CSEAT +
      B("M140 128 L134 96") +
      `<circle cx="134" cy="99" r="13" class="gd"/><path d="M146 94 l3 6 l-7 -1" class="gd"/>` +
      `<g class="rl">${A("M134 100 L138 126")}${HN(139, 128)}</g>` +
      HEAD(128, 74, 1), // 横から。肩が 上 → うしろ → 下 → 前
    x_cchest: CH_S + CSEAT + `<g class="op">${B("M140 128 L134 96")}${A("M134 102 L160 120")}${HN(162, 122)}${HEAD(128, 74, 1)}</g>`,
    x_wrist:
      CH_S +
      CSEAT +
      B("M140 128 L134 96") +
      A("M134 102 L94 104") +
      `<g class="wr"><ellipse cx="88" cy="104" rx="7" ry="9" class="skin"/></g>` +
      HEAD(128, 74, 1),
    x_heel:
      CH_S +
      Lg("M140 130 L98 130") +
      `<path d="M98 130 L98 158" class="leg">${SMIL("M98 130 L98 158", "M98 130 L100 151", 2.4)}</path>` +
      `<g class="hl"><ellipse cx="92" cy="162" rx="9" ry="5" class="ft"/></g>` +
      B("M140 128 L134 96") +
      A("M134 100 L104 124") +
      HN(102, 126) +
      HEAD(128, 74, 1), // つま先は 床のまま、かかとだけ 上がる
    x_cham:
      CH_S +
      Lg("M140 130 L98 130 L98 162") +
      FT(92, 163) +
      Lg("M140 132 L104 132 L70 146") +
      FT(64, 148) +
      `<g class="cf">${B("M140 126 L110 110")}${A("M114 112 L84 140")}${HN(82, 142)}${HEAD(98, 100, 1)}</g>`,
    // 🪷 床で 座って
    x_bfly:
      MAT +
      `<g class="wl">${Lg("M110 150 L78 146 L116 160")}</g><g class="wrr">${Lg("M130 150 L162 146 L124 160")}</g>` +
      B("M120 147 L120 116") +
      A("M107 114 Q98 136 114 158 M133 114 Q142 136 126 158") +
      HN(114, 158) +
      HN(126, 158) +
      HEAD(120, 88),
    x_janu:
      MAT +
      Lg("M156 156 Q108 150 56 158") +
      FT(52, 156) +
      Lg("M156 158 L128 160 L150 164") +
      `<g class="tr">${B("M156 152 L130 120")}${A("M134 124 L84 148")}${HN(81, 149)}${HEAD(118, 100, 1)}</g>`,
    // 🌳 立って
    x_tree:
      MAT + `<g class="sa"><g class="sw">${TREE}</g></g><g class="sb"><g transform="translate(240 0) scale(-1 1)"><g class="sw">${TREE}</g></g></g>`, // 右足で 立つ ↔ 左足で 立つ
    x_warrior: MAT + `<g class="sa">${WAR}</g><g class="sb" transform="translate(240 0) scale(-1 1)">${WAR}</g>`, // 右向き ↔ 左向き
    x_tri:
      MAT + `<g class="sa"><g class="br">${TRI}</g></g><g class="sb"><g transform="translate(240 0) scale(-1 1)"><g class="br">${TRI}</g></g></g>`, // 右に たおれる ↔ 左に たおれる
    x_sfold:
      MAT +
      Lg("M140 124 L138 160") +
      FT(132, 163) +
      `<g class="tr2">${B("M140 122 Q126 106 116 130")}${A("M118 126 L114 158")}${HN(113, 160)}<g transform="rotate(160 112 146)">${HEAD(112, 146, 1)}</g></g>`, // 頭の てっぺんは 床、顔は 足の方
    // スワイショウ: 横から。うでを 前後に ぶらぶら、ひざは やわらかく
    x_swai:
      MAT +
      `<g class="bo">${Lg("M126 128 L122 160")}${FT(116, 163)}${B("M127 126 L127 98")}<g class="sw2"><path d="M127 100 L127 140" class="arm a2"/>${HN(127, 143)}</g>${HEAD(123, 74, 1)}</g>`,
  });

  const poseSvg = k => `<svg class="fig pz-${k}" viewBox="14 44 212 140" aria-hidden="true">${POSES[k] || ""}</svg>`;

  let T = null,
    lock = null;
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PORDER = ["neck", "shrug", "x_bfly", "x_janu", "n_twist", "fold", "catcow", "child", "hug", "n_rest"];
  function mixSteps(keys) {
    // それぞれから 3 つずつ(ほかで もう えらんだ ポーズは よける)
    const got = [],
      shuf = a =>
        a
          .map(x => [Math.random(), x])
          .sort((p, q) => p[0] - q[0])
          .map(p => p[1]);
    for (const k of keys) {
      let n = 0;
      for (const st of shuf(TM[k].steps)) {
        if (n >= 3) break;
        if (got.some(g => g.pose === st.pose)) continue;
        got.push({...st, s: 50});
        n++;
      }
    }
    return got.sort((p, q) => PORDER.indexOf(p.pose) - PORDER.indexOf(q.pose));
  }
  function startTimer(k0, music) {
    const k = k0,
      def0 = TM[k0]; // music: true / false で 音つき・音なし(なければ そのタイマーの きまり)
    stopTimer();
    const def = def0.mix ? {...def0, steps: mixSteps(def0.mix)} : def0,
      total = def.steps.reduce((a, s) => a + s.s, 0),
      C = 2 * Math.PI * 112;
    BGM.use({mode: /^brush/.test(k) ? "brush" : def.pose ? "yoga" : k, lv: lv().lv}); // ヨガは どれも yoga   // 🎵 きょく で 決めた「どのタイマー」「どういうとき」に 合う曲から
    const r = el("div", "run");
    r.setAttribute("role", "dialog");
    if (def.breath) {
      // 呼吸: 平らな玉が ふくらむ・しぼむ。まん中に すう/はく と 1 秒ずつの数字。時間は 右上に 小さく、点線の輪を 1 分で 1 周する 点
      r.classList.add("br");
      r.innerHTML = `<div class="nm bh"><span>${def.e} ${def.n}</span><span class="left"></span></div><div class="breath"><div class="bbox"><svg viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="146" fill="none" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="1 7" stroke-linecap="round"/><circle class="trav" cx="150" cy="4" r="4" fill="var(--teal)" opacity=".7"/></svg><div class="halo"></div><div class="orb"></div><div class="word"><span class="wd">すう</span><b class="num">1</b></div></div><div class="hint"></div></div><button class="mx" hidden>🔀 ちがう音</button><div class="ctrl"><button class="mu">🎵 音</button><button class="pz">⏸ 一時停止</button><button class="st">おわる</button></div>`;
    } else
      r.innerHTML = `<div class="nm"></div>${def.pose ? `<div class="pose"></div><div class="pt"><small>あと</small><b class="big"></b><small>びょう</small></div><div class="pbar"><i></i></div><div class="all"></div>` : def.mouth ? `<div class="mouth">${mouthSvg()}<div class="mid"><div class="spot"><small>あと</small><b class="big"></b><small>びょう</small></div></div></div><div class="pbar"><i></i></div><div class="all"></div>` : `<div class="ring">${def.breath ? '<div class="orb"></div>' : ""}<svg viewBox="0 0 250 250"><circle cx="125" cy="125" r="112" fill="none" stroke="var(--line)" stroke-width="10"/><circle class="arc" cx="125" cy="125" r="112" fill="none" stroke="var(--teal)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><div class="mid"><div class="big"></div></div></div>`}<div class="step"></div><div class="stepsub"></div><div class="nextup"></div><button class="mx" hidden>🔀 ちがう音</button><div class="ctrl"><button class="mu">🎵 音</button><button class="pz">⏸ 一時停止</button><button class="st">おわる</button></div>`;
    if (!def.breath) r.querySelector(".nm").textContent = def.mouth ? `${def.e} ${def.n}` : `${def.e} ${def.n}・${def.d}`; // 歯みがき は ささっと・じっくり だけ(分は出さない)
    document.body.append(r);
    const q = s => r.querySelector(s);
    T = {def, total, r, q, t0: performance.now(), music: false, C, last: -1};
    q(".st").onclick = stopTimer;
    q(".pz").onclick = () => {
      // 一時停止: 時間を止めて 音も止める。つづけると 止めた分だけ うしろへずらす
      if (!T.paused) {
        T.paused = performance.now();
        cancelAnimationFrame(T.raf);
        T.wasMusic = T.music;
        if (T.music) {
          musicOff();
          T.music = false;
          q(".mu").classList.remove("on");
          q(".mx").hidden = true;
        }
        q(".pz").textContent = "▶ つづける";
        q(".pz").classList.add("on");
        r.classList.add("paused");
        const fg = q(".fig");
        if (fg && fg.pauseAnimations) fg.pauseAnimations();
      } else {
        T.t0 += performance.now() - T.paused;
        T.paused = 0;
        if (T.wasMusic) {
          T.music = musicOn();
          q(".mu").classList.toggle("on", T.music);
          q(".mx").hidden = !T.music || BGM.tracks(true).length < 2;
        }
        q(".pz").textContent = "⏸ 一時停止";
        q(".pz").classList.remove("on");
        r.classList.remove("paused");
        const fg = q(".fig");
        if (fg && fg.unpauseAnimations) fg.unpauseAnimations();
        T.raf = requestAnimationFrame(tick);
      }
    };
    const mxShow = () => {
      q(".mx").hidden = !T.music || BGM.tracks(true).length < 2;
    }; // 曲が 1 つなら 🔀 は出さない
    koeBtn(q, def);
    q(".mu").onclick = () => {
      T.music = !T.music;
      if (T.music) T.music = musicOn();
      else musicOff();
      q(".mu").classList.toggle("on", T.music);
      mxShow();
    };
    q(".mx").onclick = () => {
      const n = nextTune();
      if (T.music) musicOn();
      G.toast("🎵 " + n);
    };
    if (music ?? def.music) {
      T.music = musicOn();
      q(".mu").classList.toggle("on", T.music);
    }
    mxShow();
    try {
      navigator.wakeLock
        .request("screen")
        .then(l => (lock = l))
        .catch(() => {});
    } catch (e) {}
    T.raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (!T || T.paused) return;
    const q = T.q,
      t = (now - T.t0) / 1000,
      left = Math.max(0, T.total - t);
    if (q(".arc")) q(".arc").setAttribute("stroke-dashoffset", String(T.C * Math.min(1, t / T.total)));
    if (q(".pbar i")) q(".pbar i").style.width = (100 * Math.min(1, t / T.total)).toFixed(1) + "%";
    const sec = Math.ceil(left),
      mmss = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
    let acc = 0,
      i = 0;
    for (; i < T.def.steps.length; i++) {
      if (t < acc + T.def.steps[i].s) break;
      acc += T.def.steps[i].s;
    }
    if (T.def.mouth || T.def.pose) {
      // 歯みがき・ヨガ: いまの所(ポーズ)の あと何秒を 大きく、下に ぜんぶの あと何分
      q(".big").textContent = String(i < T.def.steps.length ? Math.max(1, Math.ceil(acc + T.def.steps[i].s - t)) : 0);
      q(".all").textContent = "ぜんぶで あと " + mmss;
    } else if (!T.def.breath) q(".big").textContent = mmss;
    if (T.def.breath) {
      // 4 秒すって 6 秒はく。p = 0 しぼんだ 〜 1 ふくらんだ(ゆっくり はじまって ゆっくり おわる)
      const c = t % 10,
        inh = c < 4,
        ph = inh ? 0 : 1,
        ez = x => 0.5 - 0.5 * Math.cos(Math.PI * x),
        p = inh ? ez(c / 4) : 1 - ez((c - 4) / 6);
      const orb = q(".orb"),
        halo = q(".halo");
      if (RM) orb.style.opacity = (0.6 + 0.4 * p).toFixed(3);
      else {
        orb.style.transform = `scale(${(0.58 + 0.42 * p).toFixed(4)})`;
        halo.style.transform = `scale(${(0.7 + 0.45 * p).toFixed(4)})`;
      }
      halo.style.opacity = (0.35 + 0.65 * p).toFixed(3);
      const a = 2 * Math.PI * Math.min(1, t / T.total) - Math.PI / 2,
        tr = q(".trav");
      tr.setAttribute("cx", (150 + 146 * Math.cos(a)).toFixed(1));
      tr.setAttribute("cy", (150 + 146 * Math.sin(a)).toFixed(1));
      q(".left").textContent = "あと " + mmss;
      if (ph !== T.last) {
        const first = T.last < 0;
        T.last = ph;
        const w = q(".wd");
        if (window.KOE) (KOE.sayBreath || (() => say(KOE.BR[inh ? 0 : 1])))(inh, Math.floor(t / 10)); // 🎙️ くわしく なら はじめの 2 回は ひとことも
        if (!first) {
          w.style.opacity = 0;
          setTimeout(() => {
            w.textContent = inh ? "すう" : "はく";
            w.style.opacity = 1;
          }, 450);
        }
        const h = q(".hint"),
          hs = inh ? "おなかが ふくらむのを感じて" : "ろうそくを ゆらすくらいの 細い息で";
        h.style.opacity = 0;
        setTimeout(
          () => {
            h.textContent = hs;
            h.style.opacity = 1;
          },
          first ? 0 : 450,
        ); // ひとことは 毎回(すう・はくで 入れかわる)
        T.r.classList.toggle("inh", inh);
        T.r.classList.toggle("exh", !inh);
      }
      const k = Math.floor(inh ? c : c - 4) + 1;
      if (k !== T.sec) {
        T.sec = k;
        q(".num").textContent = String(k);
      }
    } else if (i !== T.last && i < T.def.steps.length) {
      T.last = i;
      const s = T.def.steps[i],
        n = T.def.steps[i + 1];
      q(".step").textContent = s.t;
      q(".stepsub").textContent = s.sub;
      const nu = q(".nextup");
      nu.textContent = "";
      if (n) {
        if (n.pose) {
          const w = document.createElement("span");
          w.className = "pose nfig";
          w.innerHTML = poseSvg(n.pose);
          nu.append(w);
        }
        nu.append(Object.assign(document.createElement("span"), {textContent: "つぎは " + n.t}));
      } // ヨガは つぎの ポーズの 小さな絵も
      if (s.z) mouthAt(T.r, s.z);
      if (s.pose && q(".pose")) q(".pose").innerHTML = poseSvg(s.pose);
      if (i > 0) ding();
      if (window.KOE)
        setTimeout(
          () => {
            if (T && T.last === i) KOE.sayStep ? KOE.sayStep(s) : say(KOE.step(s));
          },
          i > 0 ? 500 : 0,
        ); // ポン の あとに
    }
    if (left <= 0) return finish();
    T.raf = requestAnimationFrame(tick);
  }
  function finish() {
    cancelAnimationFrame(T.raf);
    musicOff();
    ding(784, 0.12);
    setTimeout(() => ding(1046.5, 0.1), 350);
    if (window.KOE) setTimeout(() => say(KOE.END), 900);
    const r = T.r;
    r.textContent = "";
    r.classList.remove("inh", "exh");
    const w = el("div", "rest");
    w.style.flex = "1";
    w.style.justifyContent = "center";
    if (T.def.mouth) w.append(el("div", "ic", "🦷✨"), el("div", "done", "ぴかぴか"), el("div", null, "おつかれさま。"));
    else w.append(el("div", "ic", "🍃"), el("div", "done", "おつかれさま"), el("div", null, "また 気が向いたら。"));
    const c = el("div", "ctrl"),
      b = el("button", null, "もどる");
    b.onclick = stopTimer;
    // ヨガ(pose)は コースの 絵文字・名前で
    const st = T.def.stamp || (T.def.pose ? {e: T.def.e, t: T.def.n, k: "kibun", src: "hitoiki"} : null);
    if (st) {
      // ご自愛の スタンプ帳へ(押すかは 持ち主が決める。押さなくても 何も言わない)
      const sp = el("button", "on", `🌸 スタンプを押す`);
      sp.onclick = async () => {
        sp.disabled = true;
        await G.stamp(st);
        sp.textContent = "押しました";
      };
      c.append(sp);
    }
    c.append(b);
    r.append(w, c);
    if (lock) {
      lock.release().catch(() => {});
      lock = null;
    }
  }
  function koeBtn(q, def) {
    // 🗣️ こえ: 読み上げを 出す・止める(🎙️ こえ で 声を えらんでいるときだけ。どの タイマーでも 同じ 1 つの きりかえ)
    if (window.KOE && !KOE.S) {
      const t0 = T;
      KOE.load(false).then(() => {
        if (T === t0 && T && !T.q(".ko")) koeBtn(q, def);
      });
      return;
    } // まだ 読みこみ中なら 読めてから
    if (!window.KOE || !KOE.S || !KOE.S.voice) return;
    const c = q(".ctrl"),
      b = el("button", "ko" + (KOE.S.on ? " on" : ""), "🗣️ こえ");
    b.setAttribute("aria-pressed", String(!!KOE.S.on));
    c.classList.add("four");
    c.insertBefore(b, q(".pz"));
    b.onclick = () => {
      const on = !KOE.S.on;
      KOE.S = {...KOE.S, on};
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      if (!on) KOE.stop();
      else if (T && !def.breath && T.last >= 0 && T.def.steps[T.last]) KOE.sayStep(T.def.steps[T.last]); // 出したら いまの所を すぐ 読む
      G.toast(on ? "🗣️ 読み上げます" : "🗣️ 読み上げを 止めました");
      fetch("api/hitoiki/koe", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({on})}).catch(() => {});
    };
  }
  function stopTimer() {
    if (window.KOE) KOE.stop();
    if (!T) return;
    cancelAnimationFrame(T.raf);
    const was = T;
    T = null;
    musicOff();
    was.r.remove();
    if (lock) {
      lock.release().catch(() => {});
      lock = null;
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && T && T.r.isConnected && lock === null) {
      try {
        navigator.wakeLock
          .request("screen")
          .then(l => (lock = l))
          .catch(() => {});
      } catch (e) {}
    }
  });

  // ---- 息抜きの もと(lv = 出す げんき。night = 夜 21 時〜) ----
  const POOL = [
    {lv: [0, 1], ic: "🌬️", t: "ゆっくり 吐く呼吸を 1分", s: "吐く息を 長くすると、体が ゆるみやすい", go: "breath"},
    {lv: [0, 1, 2], ic: "🪷", t: "瞑想 3分", s: "すわって、息に 気づくだけ", go: "meiso3"},
    {lv: [0], ic: "🎵", t: "横になって 1曲だけ", s: "何もしないで、音だけ", go: "song"},
    {lv: [0, 1], night: true, ic: "🌙", t: "ふとんヨガ 5分", s: "ねる前に、ふとんの上で。あおむけ中心", go: "nemae"},
    {lv: [0, 1], ic: "🪑", t: "いすヨガ 肩こりコース 5分", s: "いすで 肩・首・手首を ほぐす", go: "katakori"},
    {lv: [1], ic: "🧘", t: "床ヨガ 足・こしコース 5分", s: "床に 座って、ちょうちょ から", go: "yuka"},
    {lv: [0, 1], ic: "🪑", t: "いすヨガ 全身コース 5分", s: "いすに 座ったまま。のびて、ひねって、まるめる", go: "isu"},
    {lv: [1], ic: "🧘", t: "床ヨガ 首・肩コース 5分", s: "首と肩と背中。すわっても できる", go: "yoga5"},
    {lv: [1, 2], ic: "🪟", t: "窓の外の 遠くを 1分見る", s: "画面から 目を はなす", go: "look"},
    {lv: [2], ic: "🚶", t: "15分だけ 外を歩く", s: "空と 木を見ながら。帰ってきたら 水を1杯", go: "walk"},
    {lv: [2], ic: "🌿", t: "立ってヨガ 10分", s: "立って のびる。最後は あおむけで", go: "yoga10"},
    {lv: [0, 1, 2], night: true, ic: "🪥", t: "歯みがき", s: "いま みがく所を 絵で お知らせします", go: "brush"},
  ];
  // たな の中身から: 種類ごとに 出す げんき と 言いかた
  const FROM = {
    book: [[1, 2], "📚", x => `『${x.t.replace(/^『|』$/g, "")}』を 10ページ`, "つづきから。読まなくても いい"],
    music: [[0, 1, 2], "🎵", x => `「${x.t}」を 1曲`, "聞くだけ"],
    video: [[0, 1], "🎬", x => x.t, "見るだけ"],
    game: [[1], "🎮", x => `${x.t} を 1回だけ`, "とちゅうで やめても いい"],
    photo: [[0, 1], "🖼️", x => x.t, "そのときの音や においを 思い出してみる"],
    word: [[0, 1], "💬", x => x.t, "前に 入れた ことば"],
  };
  const OLD = 14 * 864e5;
  // たな の きぶん: 1 しずかに 〜 5 テンション上げる の 1 つ。
  // 決めたものは その日の 曲の きぶん(⏱️ タイマー の 丸)で 出す/出さない(曲と 同じ 決まり: BGM.allow)。決めてなければ 種類の げんき の きまり
  const MOODS = [
    [1, "しずかに"],
    [2, "落ち着く"],
    [3, "ふつう"],
    [4, "ちょっと上げる"],
    [5, "テンション上げる"],
  ];
  const fitsNow = (x, L) => (x.mood ? typeof BGM === "undefined" || BGM.allow(BGM.mood()).includes(x.mood) : FROM[x.c][0].includes(L));
  function moodRow(cur, pick, title = "きぶん", none = "") {
    // 5 つの 丸。none が あれば もう一度 押すと 外せる(null)
    const w = el("div", "mood"),
      lab = el("span", "ml"),
      row = el("div", "mrow");
    const show = v => {
      lab.textContent = "";
      lab.append(title, el("br"), el("b", null, v ? MOODS[v - 1][1] : none));
      row.querySelectorAll("button").forEach((x, i) => x.classList.toggle("on", i === v - 1));
    };
    for (const [v, n] of MOODS) {
      const b = el("button", "d" + v);
      b.type = "button";
      b.setAttribute("aria-label", n);
      b.title = n;
      b.onclick = () => {
        cur = none && cur === v ? null : v;
        show(cur);
        pick(cur);
      };
      row.append(b);
    }
    w.append(lab, row);
    show(cur);
    return w;
  }
  function deck() {
    const L = lv().lv,
      h = new Date().getHours(),
      night = h >= 21 || h < 4;
    const off = new Set((D && D.ui && D.ui.off) || []),
      kind = p => (/^brush/.test(p.go) ? "brush" : /^meiso/.test(p.go) ? "meiso" : TM[p.go] && TM[p.go].pose ? "yoga" : p.go); // ⚙️ で 出さないもの
    const base = POOL.filter(
      p => p.lv.includes(L) && (!p.night || night) && !off.has(kind(p)) && !(window.HK_SKIP || []).includes(p.go),
    ); /* HK_SKIP = 出さない タイマー(体験版の 瞑想) */
    const shelf = (D && !off.has("shelf") ? D.items : [])
      .filter(x => FROM[x.c] && !x.arc && fitsNow(x, L))
      .map(x => {
        const f = FROM[x.c];
        return {ic: f[1], t: f[2](x), s: x.m || f[3], from: `たな の ${CE()[x.c][2]}から`, item: x, old: Date.now() - new Date(x.seen || x.ts) > OLD};
      });
    // その日の中では 同じ並び(朝 4 時で 変わる)。しばらく ひらいてないものを 先に
    let seed = [...day()].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
    const mix = a =>
      a
        .map(x => [rnd(), x])
        .sort((p, q) => p[0] - q[0])
        .map(p => p[1]);
    const s = [...mix(shelf.filter(x => x.old)), ...mix(shelf.filter(x => !x.old))],
      b = mix(base);
    if (night) {
      const k = b.findIndex(x => x.go === "brush");
      if (k > 0) b.unshift(...b.splice(k, 1));
    }
    const out = [];
    while (s.length || b.length) {
      if (b.length) out.push(b.shift());
      if (s.length) out.push(s.shift());
    }
    return out;
  }

  // Kindle の 本の リンク(read.amazon.co.jp/?asin=…。Kindle の「共有」や ブラウザの Kindle から)は「📖 Kindle で よむ」
  const isKindle = u => /^https:\/\/read\.amazon\.[a-z.]+\//.test(u || "");
  // ASIN だけ(B0… の 10 文字)や Amazon の 本の ページ(…/dp/ASIN)も Kindle の リンクに
  const toKindle = v => {
    const a = /^(B0[A-Z0-9]{8}|\d{9}[\dX])$/i.test(v) ? v : (v.match(/amazon\.[a-z.]+\/(?:.*\/)?(?:dp|gp\/product)\/([A-Z0-9]{10})/i) || [])[1];
    return a ? "https://read.amazon.co.jp/?asin=" + a.toUpperCase() : v;
  };
  const isMusic = u => /^https:\/\/music\.amazon\.[a-z.]+\/(tracks|albums|playlists|artists)\//.test(u || ""); // Amazon Music
  const isYT = u => /^https:\/\/(www\.|m\.)?(youtu\.be\/|youtube\.com\/(watch|shorts\/|live\/))/.test(u || ""); // YouTube
  const goLabel = (u, short) => (isKindle(u) ? "📖 Kindle" : isMusic(u) ? "🎵 Amazon Music" : isYT(u) ? "▶ YouTube" : short ? "ひらく" : "↗ ひらく");
  // ---- たな に入れる・なおす 窓 ----
  function itemDlg(x, done, more) {
    // more = [[ボタンの 字, 押したとき], …](たな の 長押し: 📦 しまう・🗑 けす)。押すと 窓を とじて から
    const dlg = el("dialog", "ui"),
      f = el("form");
    let c = x ? x.c : HK.cat && HK.cat !== "all" ? HK.cat : "book";
    const t = el("input", "big");
    t.placeholder = "なまえ(本の名前・曲の名前…)";
    t.maxLength = 80;
    t.value = x ? x.t : "";
    t.autocomplete = "off";
    const m = el("input", "big");
    m.placeholder = "ひとこと(なくてよい)";
    m.maxLength = 120;
    m.value = x ? x.m : "";
    const u = el("input", "big");
    u.placeholder = "URL(Kindle・Amazon Music・YouTube なら 名前も 入る)";
    u.type = "text";
    u.inputMode = "url";
    u.value = x ? x.url : "";
    u.autocomplete = "off";
    // Kindle の リンクなら 📚 本 に。名前・ひとこと が 空(か さっき 入れたまま)なら、本の 名前と 作者を 入れる
    let auto = {t: "", m: ""},
      kq = "";
    u.oninput = async () => {
      let v = u.value.trim();
      const k2 = toKindle(v);
      if (k2 !== v) {
        u.value = v = k2;
      }
      const want = isKindle(v) ? "book" : isMusic(v) ? "music" : isYT(v) ? "video" : "";
      if (!want || v === kq) return;
      kq = v;
      const mu = want === "music",
        what = {book: "本", music: "曲", video: "動画"}[want];
      if (c !== want) {
        c = want;
        draw();
      }
      if (t.value.trim() && t.value !== auto.t) return;
      const ph = t.placeholder;
      t.placeholder = `${what}の 名前を さがしています…`;
      try {
        const r = await (
          await fetch("api/hitoiki", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({kindle: v})})
        ).json();
        if (r.t && (!t.value.trim() || t.value === auto.t)) {
          t.value = r.t;
          if (!m.value.trim() || m.value === auto.m) m.value = r.m || "";
          auto = r;
          ok.disabled = false;
        } else if (!r.t) G.toast(what + "の 名前は わかりませんでした。書いてください");
      } catch (e) {}
      t.placeholder = ph;
    };
    let md = (x && x.mood) || null;
    const gc = moodRow(md, v => (md = v), "どんな きぶんの とき", "いつでも");
    const cc = el("div", "cats");
    const draw = () => {
      cc.textContent = "";
      for (const [id, e, n] of D.cats) {
        const b = el("button", c === id ? "on" : null, `${e} ${n}`);
        b.type = "button";
        b.onclick = () => {
          c = id;
          draw();
        };
        cc.append(b);
      }
    };
    draw();
    const ok = el("button", "ok", x ? "なおす" : "入れる"),
      no = el("button", "no", "やめる"),
      acts = el("div", "r");
    no.type = "button";
    no.onclick = () => dlg.close();
    ok.disabled = !t.value.trim();
    t.oninput = () => (ok.disabled = !t.value.trim());
    f.onsubmit = async ev => {
      ev.preventDefault();
      if (!t.value.trim()) return;
      ok.disabled = true;
      const body = {t: t.value, m: m.value, url: u.value, c, mood: md || 0},
        r = await send(x ? {edit: x.id, ...body} : {add: body}, x ? "なおしました" : "たな に 入れました");
      if (r) {
        dlg.close();
        done(r, x ? x.id : r.items[r.items.length - 1].id);
      } else ok.disabled = false;
    };
    acts.append(no, ok);
    const dh = el("div", "dh", x ? "なおす" : "たな に 入れる"),
      mr = el("div", "more"); // 📦 しまう・🗑 けす は 右上
    for (const [lb, fn] of more || []) {
      const b = el("button", null, lb);
      b.type = "button";
      b.onclick = () => {
        dlg.close();
        fn();
      };
      mr.append(b);
    }
    if (mr.children.length) {
      dh.classList.add("wm");
      dh.append(mr);
    }
    f.append(dh, el("div", "lb", "しゅるい"), cc, t, m, u, gc, acts);
    dlg.append(f);
    dlg.onclose = () => dlg.remove();
    document.body.append(dlg);
    dlg.showModal();
    if (!more) t.focus(); // 長押しで 開いたときは キーボードを 出さない
  }

  function genkiBtn(onChange) {
    // げんき を 3 つから えらぶ。下に 小さく どこから 決めたか
    const g = lv(),
      b = el("div", "genki"),
      seg = el("div", "gseg");
    seg.setAttribute("role", "radiogroup");
    seg.setAttribute("aria-label", "きょうの げんき");
    LVN.forEach(([e, n], v) => {
      const x = el("button", v === g.lv ? "on" : null, `${e} ${n}`);
      x.setAttribute("role", "radio");
      x.setAttribute("aria-checked", String(v === g.lv));
      x.onclick = () => {
        if (v !== g.lv) {
          setLv(v);
          onChange();
        }
      };
      seg.append(x);
    });
    b.append(seg);
    if (g.why) b.append(el("span", "why", g.why));
    return b;
  }
  function help(m, text) {
    let on = false;
    const hb = el("button", "hlp", "？"),
      ht = el("p", "sub", text);
    hb.setAttribute("aria-label", "つかいかた");
    ht.hidden = true;
    hb.onclick = () => {
      on = !on;
      ht.hidden = !on;
    };
    m.append(hb, ht);
  }
  return {
    tabs,
    load,
    send,
    lv,
    setLv,
    TM,
    TORDER,
    poseSvg,
    startTimer,
    deck,
    itemDlg,
    genkiBtn,
    help,
    goLabel,
    moodRow,
    MOODS,
    CE,
    get D() {
      return D;
    },
    cat: "all",
  };
})();
