// 🐟 入口の 水そう(ためし)
// ① 背景で ゆっくり 泡・光・ときどき魚(夜は クラゲ)
// ② しばらく さわらないと 画面いっぱいの 水族館(さわると すぐ戻る。時計は小さく残す)
// ③ 時間(朝・昼・夕・夜)と 天気(晴れ・くもり・雨・雪・霧・雷)で 水の色と ようすが変わる
// 絵は ぜんぶ ここで描く(外から読まない)。天気は いつもの api/kyou?wx=1。「動きを減らす」の端末では 止まった絵だけ。
// ためし用: ?aqh=21(時)・?aqw=rain(sun cloud rain snow fog thunder)・?aqs=1(すぐ水族館)・?aqidle=秒
(() => {
  const Q = new URLSearchParams(location.search);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 水族館までの時間(分。0 = 出さない)。この端末で覚える(⚙️ 🖼️ 入口)。はじめは 10 分
  const LK = "gojiai-aq-idle:" + location.pathname.replace(/[^/]*$/, "");
  const idleMin = () => {
    if (Q.get("aqidle")) return +Q.get("aqidle") / 60;
    try {
      const v = localStorage.getItem(LK);
      return v === null ? 10 : +v;
    } catch (e) {
      return 10;
    }
  };
  let wx = Q.get("aqw") || "cloud";
  const kind = c =>
    c == null
      ? "cloud"
      : c <= 1
        ? "sun"
        : c <= 3
          ? "cloud"
          : c <= 48
            ? "fog"
            : c <= 67
              ? "rain"
              : c <= 77
                ? "snow"
                : c <= 82
                  ? "rain"
                  : c <= 86
                    ? "snow"
                    : "thunder";
  if (!Q.get("aqw") && document.body.classList.contains("home"))
    fetch("api/kyou?wx=1", {cache: "no-store"})
      .then(r => r.json())
      .then(k => {
        const t = k.wxt || k.wx12;
        if (t && t.code != null) {
          wx = kind(t.code);
          bg.reset();
        }
      })
      .catch(() => {});
  const hour = () => {
    const d = new Date();
    return (Q.has("aqh") ? +Q.get("aqh") : d.getHours()) + d.getMinutes() / 60;
  };

  // ---- 色: 時間で 水の上・下の色と 暗さ ----
  const KEYS = [
    [0, "#0b1a36", "#030814", 0.75],
    [4.5, "#0e2040", "#040a18", 0.7],
    [6, "#3c6f9a", "#0f3050", 0.35],
    [8, "#79cfe0", "#16698a", 0],
    [15, "#5ec3e3", "#0c5378", 0],
    [17, "#8fc4cf", "#1d4d6e", 0.1],
    [18.3, "#e8a483", "#2f4772", 0.25],
    [19.5, "#2c3c6e", "#0a1430", 0.55],
    [21, "#13234a", "#050c1e", 0.7],
    [24, "#0b1a36", "#030814", 0.75],
  ];
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    a = typeof a === "string" ? hx(a) : a;
    b = typeof b === "string" ? hx(b) : b;
    return a.map((v, i) => Math.round(v + (b[i] - v) * t));
  };
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const WXMIX = {
    cloud: ["#7c8a96", 0.25],
    rain: ["#43505e", 0.42],
    thunder: ["#2f3846", 0.5],
    fog: ["#b9c4cc", 0.4],
    snow: ["#c9d6e0", 0.25],
    sun: ["#ffffff", 0],
  };
  function sky() {
    const h = hour() % 24;
    let i = 0;
    while (KEYS[i + 1][0] <= h) i++;
    const [h0, t0, b0, d0] = KEYS[i],
      [h1, t1, b1, d1] = KEYS[i + 1],
      t = (h - h0) / (h1 - h0);
    let top = mix(t0, t1, t),
      bot = mix(b0, b1, t);
    const dark = d0 + (d1 - d0) * t;
    const [wc, wt] = WXMIX[wx] || WXMIX.cloud;
    top = mix(top, wc, wt);
    bot = mix(bot, wc, wt * 0.6);
    return {
      top,
      bot,
      dark: Math.min(0.85, dark + (wx === "rain" || wx === "thunder" ? 0.12 : 0)),
      night: dark > 0.45,
      sun: wx === "sun" && dark < 0.3,
    };
  }

  // ---- 生きもの ----
  const FISH = [
    ["#F08A4B", "#FFF4E6"],
    ["#3F7FD0", "#F4C542"],
    ["#F4C542", "#FBEFB8"],
    ["#E98BA8", "#FFE6EE"],
    ["#2E9E96", "#C6F0EA"],
    ["#9B7BD0", "#EDE3FF"],
  ];
  const R = (a, b) => a + Math.random() * (b - a);
  function fish(c, f, t) {
    const s = f.s,
      w = Math.sin(t * f.wf + f.ph);
    c.save();
    c.translate(f.x, f.y + Math.sin(t * 0.7 + f.ph) * s * 0.25);
    c.scale(f.d, 1);
    c.globalAlpha = f.a;
    if (f.flat) {
      // 入口の背景: 目も しまも 無い 一色の かげ(どの背景でも ひれが消えないように、ひとつの形で 塗る)
      c.fillStyle = f.c[0];
      c.beginPath();
      c.ellipse(0, 0, s, s * 0.52, 0, 0, 7, true);
      c.moveTo(-s * 0.75, 0);
      c.lineTo(-s * 1.4, -s * 0.5 + w * s * 0.15);
      c.quadraticCurveTo(-s * 1.2, w * s * 0.1, -s * 1.4, s * 0.5 + w * s * 0.15);
      c.closePath();
      c.moveTo(-s * 0.2, -s * 0.42);
      c.quadraticCurveTo(-s * 0.45, -s * 0.9, -s * 0.7, -s * 0.3);
      c.closePath();
      c.fill();
      c.restore();
      return;
    }
    c.fillStyle = f.c[1]; // しっぽ
    c.beginPath();
    c.moveTo(-s * 0.75, 0);
    c.lineTo(-s * 1.4, -s * 0.5 + w * s * 0.15);
    c.quadraticCurveTo(-s * 1.2, w * s * 0.1, -s * 1.4, s * 0.5 + w * s * 0.15);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-s * 0.2, -s * 0.42);
    c.quadraticCurveTo(-s * 0.45, -s * 0.9, -s * 0.7, -s * 0.3);
    c.closePath();
    c.fill(); // せびれ
    c.fillStyle = f.c[0];
    c.beginPath();
    c.ellipse(0, 0, s, s * 0.52, 0, 0, 7);
    c.fill();
    c.fillStyle = f.c[1];
    c.globalAlpha = f.a * 0.85;
    c.beginPath();
    c.ellipse(-s * 0.05, 0, s * 0.13, s * 0.47, 0, 0, 7);
    c.fill(); // しま
    c.globalAlpha = f.a;
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(s * 0.55, -s * 0.1, s * 0.13, 0, 7);
    c.fill();
    c.fillStyle = "#1c1b2b";
    c.beginPath();
    c.arc(s * 0.6, -s * 0.1, s * 0.07, 0, 7);
    c.fill();
    c.restore();
  }
  function jelly(c, j, t) {
    const p = 1 + 0.1 * Math.sin(t * 1.6 + j.ph),
      r = j.r;
    c.save();
    c.translate(j.x, j.y);
    c.globalAlpha = j.a;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 2.4);
    g.addColorStop(0, rgb(j.c, 0.35));
    g.addColorStop(1, rgb(j.c, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, r * 2.4, 0, 7);
    c.fill();
    c.strokeStyle = rgb(j.c, 0.7);
    c.lineWidth = 1.4;
    c.lineCap = "round";
    for (let k = 0; k < 5; k++) {
      const x0 = (k - 2) * r * 0.32 * p;
      c.beginPath();
      c.moveTo(x0, 0);
      for (let s = 1; s <= 6; s++) c.lineTo(x0 + Math.sin(t * 2 + k + s * 0.8 + j.ph) * r * 0.18, s * r * 0.38);
      c.stroke();
    }
    c.fillStyle = rgb(j.c, 0.85);
    c.beginPath();
    c.ellipse(0, 0, r * p, (r * 0.8) / p, 0, Math.PI, 0);
    c.quadraticCurveTo(0, r * 0.2, -r * p, 0);
    c.fill();
    c.fillStyle = "rgba(255,255,255,.45)";
    c.beginPath();
    c.ellipse(-r * 0.3, -r * 0.45, r * 0.25, r * 0.12, -0.5, 0, 7);
    c.fill();
    c.restore();
  }

  // ---- ひとつの水そう(bg = 入口の背景 / ss = 水族館) ----
  function Tank(cv, full) {
    const c = cv.getContext("2d");
    let W = 0,
      H = 0,
      sk = sky(),
      bub = [],
      fs = [],
      js = [],
      dots = [],
      rip = [],
      snow = [],
      weed = [],
      rocks = [],
      flash = 0,
      nextFlash = R(6, 14),
      nextSpawn = R(3, 8),
      school = null;
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, full ? 2 : 1.5);
      W = innerWidth;
      H = innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function newFish(edge) {
      const d = Math.random() < 0.5 ? 1 : -1,
        s = full ? R(14, 30) : R(11, 19);
      return {
        s,
        d,
        x: edge ? (d > 0 ? -s * 2 : W + s * 2) : R(0, W),
        y: R(H * 0.2, H * (full ? 0.78 : 0.85)),
        v: R(18, 38) * (full ? 1 : 0.8),
        wf: R(5, 8),
        ph: R(0, 6),
        c: FISH[Math.floor(R(0, FISH.length))],
        a: full ? 1 : 0.42,
        flat: !full,
      };
    }
    const newJelly = () => ({
      r: full ? R(14, 26) : R(10, 16),
      x: R(W * 0.1, W * 0.9),
      y: H + 40,
      v: R(7, 13),
      ph: R(0, 6),
      c: Math.random() < 0.5 ? [255, 182, 214] : [190, 170, 255],
      a: full ? 0.9 : 0.5,
    });
    let ink = "255,255,255"; // 泡・わっか の色。明るい紙の背景では 白が見えないので 水の色に
    function reset() {
      size();
      sk = sky();
      ink = !full && document.documentElement.dataset.theme !== "dark" && !document.body.classList.contains("photo") ? "46,120,140" : "255,255,255";
      bub = Array.from({length: full ? 26 : 10}, () => ({x: R(0, W), y: R(0, H), r: R(1.5, full ? 5 : 3.5), v: R(14, 34), ph: R(0, 6)}));
      dots = sk.night ? Array.from({length: full ? 50 : 18}, () => ({x: R(0, W), y: R(0, H), r: R(0.8, 2), ph: R(0, 6)})) : [];
      snow = wx === "snow" ? Array.from({length: full ? 70 : 30}, () => ({x: R(0, W), y: R(0, H), r: R(1, 2.6), v: R(8, 18), ph: R(0, 6)})) : [];
      fs = full ? Array.from({length: sk.night ? 3 : 7}, () => newFish(false)) : [];
      js =
        full && sk.night
          ? Array.from({length: 3}, () => {
              const j = newJelly();
              j.y = R(H * 0.2, H * 0.8);
              return j;
            })
          : [];
      if (!full && Q.get("aqf")) {
        if (sk.night) {
          const j = newJelly();
          j.y = H * 0.74;
          js.push(j);
        } else {
          const f = newFish(false);
          f.x = W * 0.5;
          f.y = H * 0.74;
          fs.push(f);
        }
      }
      school = full && !sk.night ? {n: 14, ph: R(0, 6)} : null;
      weed = full
        ? Array.from({length: 7}, (_, i) => ({
            x: (W * (i + 0.5)) / 7 + R(-18, 18),
            h: R(H * 0.12, H * 0.26),
            ph: R(0, 6),
            c: Math.random() < 0.5 ? "#2f7d5b" : "#4a9a64",
          }))
        : [];
      rocks = full ? Array.from({length: 4}, () => ({x: R(0, W), w: R(30, 70), h: R(14, 30)})) : [];
    }
    function step(dt, t) {
      // 水
      if (full) {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, rgb(sk.top));
        g.addColorStop(1, rgb(sk.bot));
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      } else {
        c.clearRect(0, 0, W, H);
        const g = c.createLinearGradient(0, 0, 0, H * 0.7);
        g.addColorStop(0, rgb(sk.top, 0.32));
        g.addColorStop(1, rgb(sk.top, 0));
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }
      // 水面の ゆらぎ
      c.save();
      c.globalCompositeOperation = "lighter";
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(0, 0);
        for (let x = 0; x <= W; x += 12) c.lineTo(x, 10 + k * 9 + Math.sin(x / 40 + t * (0.8 + k * 0.3) + k) * 5);
        c.lineTo(W, 0);
        c.closePath();
        c.fillStyle = `rgba(255,255,255,${(full ? 0.07 : 0.05) * (1 - sk.dark)})`;
        c.fill();
      }
      // 光の筋(晴れの昼)
      if (sk.sun)
        for (let k = 0; k < 4; k++) {
          const x = W * (0.15 + k * 0.25) + Math.sin(t * 0.25 + k * 1.7) * 30,
            sw = 40 + k * 8;
          const g = c.createLinearGradient(0, 0, 0, H * 0.8);
          g.addColorStop(0, `rgba(255,255,240,${full ? 0.16 : 0.1})`);
          g.addColorStop(1, "rgba(255,255,240,0)");
          c.fillStyle = g;
          c.beginPath();
          c.moveTo(x - sw / 2, 0);
          c.lineTo(x + sw / 2, 0);
          c.lineTo(x + sw * 1.6 + 60, H * 0.8);
          c.lineTo(x + 60, H * 0.8);
          c.closePath();
          c.fill();
        }
      c.restore();
      // 砂・岩・海そう
      if (full) {
        const sy = H * 0.92,
          g = c.createLinearGradient(0, sy, 0, H);
        g.addColorStop(0, "#d9c49a");
        g.addColorStop(1, "#b39a6c");
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(0, sy);
        for (let x = 0; x <= W; x += 20) c.lineTo(x, sy + Math.sin(x / 70) * 6);
        c.lineTo(W, H);
        c.lineTo(0, H);
        c.fill();
        for (const r of rocks) {
          c.fillStyle = "#7d7468";
          c.beginPath();
          c.ellipse(r.x, sy + 8, r.w / 2, r.h, 0, Math.PI, 0);
          c.fill();
        }
        c.lineCap = "round";
        for (const w of weed) {
          c.strokeStyle = w.c;
          c.lineWidth = 7;
          c.beginPath();
          c.moveTo(w.x, sy + 6);
          for (let s = 1; s <= 8; s++) c.lineTo(w.x + Math.sin(t * 0.9 + w.ph + s * 0.45) * s * 2.2, sy + 6 - (w.h * s) / 8);
          c.stroke();
        }
      }
      // 小さな魚の群れ
      if (school) {
        const cx = W / 2 + Math.sin(t * 0.13 + school.ph) * W * 0.38,
          cy = H * 0.45 + Math.sin(t * 0.21 + school.ph) * H * 0.14,
          d = Math.cos(t * 0.13 + school.ph) >= 0 ? 1 : -1;
        for (let k = 0; k < school.n; k++)
          fish(
            c,
            {
              s: 5.5,
              d,
              x: cx + Math.sin(k * 2.4) * 34 + Math.sin(t + k) * 4,
              y: cy + Math.cos(k * 1.7) * 18,
              wf: 12,
              ph: k,
              c: ["#c9d7e3", "#eef4fa"],
              a: 0.9,
            },
            t,
          );
      }
      // 魚
      if (!full) {
        // 背景: ときどき 1 ぴき(夜は クラゲ)
        nextSpawn -= dt;
        if (nextSpawn < 0 && fs.length + js.length < 1) {
          sk.night ? js.push(newJelly()) : fs.push(newFish(true));
          nextSpawn = R(25, 55);
        }
      }
      for (const f of fs) {
        f.x += f.d * f.v * dt;
        fish(c, f, t);
      }
      fs = fs.filter(f => (full ? true : f.x > -80 && f.x < W + 80));
      if (full) for (const f of fs) if (f.x < -f.s * 3 || f.x > W + f.s * 3) Object.assign(f, newFish(true));
      // 泡
      c.lineWidth = 1;
      for (const b of bub) {
        b.y -= b.v * dt;
        if (b.y < -10) {
          b.y = H + 10;
          b.x = R(0, W);
        }
        const x = b.x + Math.sin(t * 1.5 + b.ph) * 4;
        c.beginPath();
        c.arc(x, b.y, b.r, 0, 7);
        if (full) {
          c.strokeStyle = "rgba(255,255,255,.55)";
          c.fillStyle = "rgba(255,255,255,.12)";
          c.fill();
          c.stroke();
        } else {
          c.fillStyle = `rgba(${ink},${ink[0] === "2" ? 0.28 : 0.22})`;
          c.fill();
        } // 入口の背景: ふちの線なし
      }
      // 雪(マリンスノー)
      for (const s of snow) {
        s.y += s.v * dt;
        if (s.y > H + 5) {
          s.y = -5;
          s.x = R(0, W);
        }
        c.fillStyle = `rgba(${ink},.6)`;
        c.beginPath();
        c.arc(s.x + Math.sin(t * 0.7 + s.ph) * 6, s.y, s.r, 0, 7);
        c.fill();
      }
      // 雨: 水面の わっか
      if (wx === "rain" || wx === "thunder") {
        if (Math.random() < dt * (full ? 9 : 4)) rip.push({x: R(0, W), y: full ? R(6, H * 0.08) : R(0, H), r: 0, a: 1});
        for (const r of rip) {
          r.r += dt * 26;
          r.a -= dt * 0.9;
          c.strokeStyle = `rgba(${ink},${Math.max(0, r.a) * (full ? 0.6 : 0.45)})`;
          c.beginPath();
          c.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, 7);
          c.stroke();
        }
        rip = rip.filter(r => r.a > 0);
      }
      // 霧
      if (wx === "fog") {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "rgba(230,236,240,.28)");
        g.addColorStop(1, "rgba(230,236,240,.05)");
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }
      // 夜の 暗さ(水族館だけ。背景は 入口の色のまま)
      if (full && sk.dark > 0) {
        c.fillStyle = `rgba(4,8,26,${sk.dark * 0.5})`;
        c.fillRect(0, 0, W, H);
      }
      // 光るもの(夜): プランクトン・クラゲ
      for (const d of dots) {
        const a = 0.35 + 0.35 * Math.sin(t * 1.3 + d.ph);
        c.fillStyle = `rgba(150,240,255,${a * (full ? 1 : 0.7)})`;
        c.beginPath();
        c.arc(d.x + Math.sin(t * 0.3 + d.ph) * 8, d.y + Math.cos(t * 0.2 + d.ph) * 6, d.r, 0, 7);
        c.fill();
      }
      if (full && sk.night && !js.length) js.push(newJelly());
      for (const j of js) {
        j.y -= j.v * dt * (0.4 + 0.6 * Math.max(0, Math.sin(t * 1.6 + j.ph)));
        j.x += Math.sin(t * 0.4 + j.ph) * 6 * dt;
        jelly(c, j, t);
      }
      if (full) for (const j of js) if (j.y < -60) Object.assign(j, newJelly());
      js = js.filter(j => j.y > -60);
      // 雷(水族館だけ。ふわっと)
      if (full && wx === "thunder") {
        nextFlash -= dt;
        if (nextFlash < 0) {
          flash = 0.22;
          nextFlash = R(9, 22);
        }
        if (flash > 0) {
          c.fillStyle = `rgba(255,255,255,${flash})`;
          c.fillRect(0, 0, W, H);
          flash -= dt * 0.5;
        }
      }
    }
    let raf = 0,
      last = 0,
      on = false;
    const fps = full ? 30 : 20;
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (ts - last < 1000 / fps - 2) return;
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0.03;
      last = ts;
      step(dt, ts / 1000);
    }
    reset();
    addEventListener("resize", () => {
      if (on) reset();
    });
    return {
      start() {
        if (on) return;
        on = true;
        reset();
        if (still) {
          step(0.03, 10);
          return;
        }
        last = 0;
        raf = requestAnimationFrame(frame);
      },
      stop() {
        on = false;
        cancelAnimationFrame(raf);
      },
      reset() {
        if (on) {
          const was = on;
          this.stop();
          if (was) this.start();
        }
      },
      get on() {
        return on;
      },
    };
  }

  // ⚙️ の 🖼️ 入口 に「🐟 水族館」(common.js が 呼ぶ)
  // 入口の背景で 泳ぐか(この端末で覚える。はじめは 出さない。)
  const BK = "gojiai-aq-bg:" + location.pathname.replace(/[^/]*$/, "");
  const bgOn = () => {
    try {
      return localStorage.getItem(BK) !== "0"; /* まだ えらんで いなければ 泳ぐ */
    } catch (e) {
      return false;
    }
  };
  // ⚙️ の 🖼️ 入口 に「水そう」(common.js が 呼ぶ)
  function settings(pane) {
    const seg2 = (now, opts, pick) => {
      const seg = G.el("div", "seg2");
      const draw = () => {
        seg.textContent = "";
        for (const [v, t] of opts) {
          const b = G.el("button", now() === v ? "on" : null, t);
          b.type = "button";
          b.onclick = () => {
            pick(v, t);
            draw();
          };
          seg.append(b);
        }
      };
      draw();
      return seg;
    };
    const b1 = G.el("div", "box gwp"),
      b2 = G.el("div", "box gwp");
    b1.append(
      G.el("span", "nm", "🐟 背景で泳ぐ"),
      seg2(
        bgOn,
        [
          [true, "出す"],
          [false, "出さない"],
        ],
        v => {
          try {
            localStorage.setItem(BK, v ? "1" : "0");
          } catch (e) {}
          G.toast(v ? "入口で 魚が泳ぎます" : "入口の魚を しまいました");
        },
      ),
    );
    const n2 = G.el("span", "nm", "🐠 さわらないと 水族館(スクリーンセーバー)");
    n2.style.flex = "1 0 100%";
    b2.style.flexWrap = "wrap";
    b2.append(
      n2,
      seg2(
        idleMin,
        [
          [0, "出さない"],
          [1, "1分"],
          [3, "3分"],
          [5, "5分"],
          [10, "10分"],
        ],
        (v, t) => {
          try {
            localStorage.setItem(LK, String(v));
          } catch (e) {}
          G.toast(v ? `${t} さわらないと 水族館にします` : "水族館は 出しません");
        },
      ),
    );
    pane.append(G.el("h2", null, "水そう"), b1, b2);
  }
  if (!document.body.classList.contains("home")) {
    window.AQ = {settings};
    return;
  }
  // ① 背景
  const bcv = document.createElement("canvas");
  bcv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none";
  document.body.prepend(bcv);
  const bg = Tank(bcv, false),
    bgGo = () => {
      if (bgOn()) bg.start();
    };
  bgGo();

  // ② 水族館
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;inset:0;z-index:50;display:none;opacity:0;transition:opacity .9s;touch-action:none;cursor:pointer";
  const scv = document.createElement("canvas");
  scv.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  const ck = document.createElement("div");
  ck.style.cssText =
    "position:absolute;left:0;right:0;bottom:calc(14% + env(safe-area-inset-bottom));text-align:center;color:rgba(255,255,255,.78);font-family:var(--head);text-shadow:0 1px 8px rgba(0,0,0,.35);pointer-events:none";
  box.append(scv, ck);
  document.body.append(box);
  const ss = Tank(scv, true);
  const W7 = "日月火水木金土";
  const tickCk = () => {
    const d = new Date();
    ck.innerHTML = `<div style="font-weight:800;font-size:44px;font-variant-numeric:tabular-nums">${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}</div><div style="font-weight:700;font-size:15px">${d.getMonth() + 1}月${d.getDate()}日(${W7[d.getDay()]})</div>`;
  };
  let ckT = 0,
    idleT = 0,
    shown = false;
  function open() {
    if (shown || document.hidden || document.querySelector("dialog[open]") || document.body.classList.contains("arrange")) return;
    shown = true;
    bg.stop();
    box.style.display = "block";
    ss.start();
    tickCk();
    ckT = setInterval(tickCk, 15000);
    requestAnimationFrame(() => (box.style.opacity = "1"));
  }
  function close() {
    if (!shown) return;
    shown = false;
    box.style.opacity = "0";
    clearInterval(ckT);
    setTimeout(() => {
      if (!shown) {
        box.style.display = "none";
        ss.stop();
      }
    }, 900);
    bgGo();
  }
  // さわったら すぐ戻る(下のボタンは 押さない)
  box.addEventListener("pointerdown", e => {
    e.preventDefault();
    e.stopPropagation();
    close();
    poke();
  });
  box.addEventListener(
    "click",
    e => {
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );
  function poke() {
    clearTimeout(idleT);
    const m = idleMin();
    if (m > 0) idleT = setTimeout(open, m * 60000);
  }
  for (const ev of ["pointerdown", "keydown", "wheel", "scroll", "touchstart"])
    addEventListener(
      ev,
      () => {
        if (!shown) poke();
      },
      {passive: true, capture: true},
    );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      bg.stop();
      ss.stop();
    } else if (shown) ss.start();
    else {
      bgGo();
      poke();
    }
  });
  poke();
  if (Q.get("aqs")) setTimeout(open, 600);
  window.AQ = {open, close, settings, poke};
})();
