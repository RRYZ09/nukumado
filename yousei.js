// ようせいさん: 入口に住む子(ゆらゆらさん = くらげ、もくもくさん = ひつじ)。絵・動き・設定の読み書き。見た目の決まりは yousei.css。
// 使うところ: 入口(common.js の home)と、せってい →「🪼 ようせい」のプレビュー。どちらも common.js が必要なときだけ読みこむ。
// 決まりごと: しゃべらない(しるしのことば。訳は出さない)・世話をさせない・ふよふよ浮く・絵は裏返さない(向きは 顔・目の光・しっぽで)・
//   線は手がきっぽく でも揺らさない・色は2つでグラデーション・さわると こっちを向く・つまんで動かせる・ものを あげられる(ひとり1つ。持ちかえる)。
// 設定はこの端末だけ(localStorage "gojiai-yousei-cfg"): {on: {yura, moku}, col: {yura: [からだ, かざり], …}, p: {yura: {size, speed, pace, talk}, …}, item: {yura: "nui", …}}
//   色も うごきも もちものも、ひとりずつ別に覚える
const Yousei = (() => {
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  // ---------------- 絵(svg の文字列。もとは左向き) ----------------
  // 顔: 目(まぶたつき)・うれしい目(eh)・口(mo/ms/mh)・ほっぺ・もちもの。xl/xr は左右の目、y は目の高さ、id は絵ごとに別の名前
  const face = (id, xl, xr, y, mouth, iy = y) => {
    // mouth: "u"・"w"・"none"(くちばしの子)。iy: もちものを持つ高さの もと(ふつうは目の高さと同じ)
    const rx = 6.8,
      ry = 8.4;
    const eye = (x, n) => `<clipPath id="${id}${n}"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/></clipPath>
      <g clip-path="url(#${id}${n})"><ellipse class="ir" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#3A322D"/>
        <ellipse class="c2d ir" cx="${x}" cy="${y + 4.2}" rx="${rx - 1.6}" ry="${ry - 4.2}" opacity=".7"/>
        <circle class="ir" cx="${x - 2.2}" cy="${y - 3.4}" r="2.6" fill="#fff"/><circle class="ir" cx="${x + 2.6}" cy="${y + 2.4}" r="1.1" fill="#fff" opacity=".85"/>
        <g class="lid"><path class="fc" d="M${x - rx - 2} ${y - ry - 20} H${x + rx + 2} V${y + ry - 2.5} Q${x} ${y + ry + 1.5} ${x - rx - 2} ${y + ry - 2.5} Z"/>
          <path class="ink" style="stroke-width:2.3" d="M${x - rx - 2} ${y + ry - 2.5} Q${x} ${y + ry + 1.5} ${x + rx + 2} ${y + ry - 2.5}"/></g></g>`;
    const m = (xl + xr) / 2,
      my = y + 9,
      imy = iy + 9,
      nomouth = mouth === "none";
    const maraca = (
      hx,
      dir,
    ) => `<g class="${dir < 0 ? "shakeL" : "shakeR"}"><path d="M${hx} ${iy + 28} L${hx + dir * 8} ${iy + 13}" stroke="#a9773a" stroke-width="3.4" stroke-linecap="round"/>
        <ellipse cx="${hx + dir * 11}" cy="${iy + 5}" rx="7.5" ry="9.5" class="c2 ol2" transform="rotate(${dir * 24} ${hx + dir * 11} ${iy + 5})"/>
        <path d="M${hx + dir * 5} ${iy + 3} q${dir * 6} 5 ${dir * 13} 3" class="ink" style="stroke:#fff;stroke-width:2.2;opacity:.8"/><circle cx="${hx + dir * 12}" cy="${iy}" r="1.3" fill="#fff"/>
        <circle class="hand ol" cx="${hx}" cy="${iy + 28}" r="5"/></g>`;
    return `${nomouth ? "" : `<ellipse class="c2" cx="${xl - 6}" cy="${y + 11}" rx="5" ry="3" opacity=".75"/><ellipse class="c2" cx="${xr + 6}" cy="${y + 11}" rx="5" ry="3" opacity=".75"/>`}
    <g class="eo">${eye(xl, "l")}${eye(xr, "r")}</g>
    <g class="eh"><path class="ink" d="M${xl - 6.5} ${y + 3} q6.5 -9.5 13 0"/><path class="ink" d="M${xr - 6.5} ${y + 3} q6.5 -9.5 13 0"/></g>
    ${
      nomouth
        ? ""
        : `  <path class="ink mo" style="stroke-width:2" d="${mouth === "w" ? `M${m - 5.5} ${my} q2.75 3.6 5.5 0 q2.75 3.6 5.5 0` : `M${m - 3.5} ${my + 1} q3.5 3.5 7 0`}"/>
    <ellipse class="ms" cx="${m}" cy="${my + 2.5}" rx="1.8" ry="2.2" fill="#3A322D" opacity=".8"/>
    <g class="mh"><path d="M${m - 6.5} ${my - 1} L${m + 6.5} ${my - 1} L${m} ${my + 9} Z" fill="#9c4334" stroke="#3A322D" stroke-width="1.8" stroke-linejoin="round"/><path d="M${m - 2.6} ${my + 4.6} L${m + 2.6} ${my + 4.6} L${m} ${my + 8} Z" fill="#f29aa2"/></g>
  `
    }
  <ellipse class="chew" cx="${m}" cy="${imy + 1.5}" rx="3" ry="2.4" fill="#9c4334" stroke="#3A322D" stroke-width="1.4"/>
    <g class="it it-mara">${maraca(m - 27, -1)}${maraca(m + 27, 1)}</g>
    <g class="it it-mafu"><path class="c2 ol2" d="M${xl - 17} ${iy + 17} Q${m} ${iy + 27} ${xr + 17} ${iy + 17} L${xr + 18} ${iy + 25} Q${m} ${iy + 36} ${xl - 18} ${iy + 25} Z"/>
      <g class="flut"><path class="c2 ol2" d="M${xr + 8} ${iy + 22} L${xr + 19} ${iy + 24} L${xr + 23} ${iy + 44} L${xr + 12} ${iy + 45} Z"/><path d="M${xr + 14} ${iy + 45} v4 M${xr + 18} ${iy + 44.6} v4 M${xr + 22} ${iy + 44.2} v4" class="ink" style="stroke-width:1.5"/></g>
      <path d="M${xl - 10} ${iy + 24} q4 3 8 4 M${m - 4} ${iy + 28} q4 1 8 0" class="ink" style="stroke:#fff;stroke-width:1.6;opacity:.6"/></g>
    <g class="it it-kasa"><path d="M${m + 27} ${iy + 28} V${iy - 44}" stroke="#8a6a4a" stroke-width="2.6" stroke-linecap="round"/>
      <path class="c2 ol2" d="M${m - 3} ${iy - 42} C${m + 2} ${iy - 72} ${m + 52} ${iy - 72} ${m + 57} ${iy - 42} Q${m + 49.5} ${iy - 49} ${m + 42} ${iy - 42} Q${m + 34.5} ${iy - 49} ${m + 27} ${iy - 42} Q${m + 19.5} ${iy - 49} ${m + 12} ${iy - 42} Q${m + 4.5} ${iy - 49} ${m - 3} ${iy - 42} Z"/>
      <path d="M${m + 27} ${iy - 65} V${iy - 44} M${m + 27} ${iy - 65} Q${m + 14} ${iy - 60} ${m + 12} ${iy - 43} M${m + 27} ${iy - 65} Q${m + 40} ${iy - 60} ${m + 42} ${iy - 43}" class="ink" style="stroke-width:1.2;opacity:.35"/>
      <circle cx="${m + 27}" cy="${iy - 67}" r="2.2" fill="#8a6a4a"/><circle class="hand ol" cx="${m + 27}" cy="${iy + 28}" r="5"/></g>
    <g class="it it-mug"><path class="steam ink" style="stroke:#fff;stroke-width:2;opacity:.8" d="M${m - 4} ${iy + 17} q-3 -4 0 -7"/><path class="steam b ink" style="stroke:#fff;stroke-width:2;opacity:.8" d="M${m + 4} ${iy + 17} q3 -4 0 -7"/>
      <path d="M${m + 9} ${iy + 23} q8 0 7 6 q-1 5 -8 4" fill="none" stroke="#5b4a42" stroke-width="5" stroke-linecap="round"/><path d="M${m + 9} ${iy + 23} q8 0 7 6 q-1 5 -8 4" fill="none" style="stroke:var(--c2)" stroke-width="2.4" stroke-linecap="round"/>
      <rect class="c2 ol2" x="${m - 10}" y="${iy + 19}" width="20" height="17" rx="4"/><ellipse cx="${m}" cy="${iy + 21}" rx="7.5" ry="2" fill="#7a4a2c"/>
      <path d="M${m - 5} ${iy + 28} l2 2 l3 -4" class="ink" style="stroke:#fff;stroke-width:1.6;opacity:.7"/>
      <circle class="hand ol" cx="${m - 12}" cy="${iy + 29}" r="5"/><circle class="hand ol" cx="${m + 12}" cy="${iy + 30}" r="5"/></g>
    <g class="it it-sute"><g class="wave"><path d="M${m + 26} ${iy + 28} L${m + 38} ${iy + 4}" stroke="#8a6a4a" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M0 -10 L2.9 -3.6 L9.8 -3 L4.6 1.6 L6.2 8.4 L0 4.8 L-6.2 8.4 L-4.6 1.6 L-9.8 -3 L-2.9 -3.6 Z" transform="translate(${m + 39} ${iy + 1})" fill="#F2C94C" stroke="#8a6420" stroke-width="1.6" stroke-linejoin="round"/>
        <g fill="#F2C94C" class="steam"><circle cx="${m + 52}" cy="${iy - 8}" r="1.8"/><circle cx="${m + 28}" cy="${iy - 12}" r="1.4"/><circle cx="${m + 50}" cy="${iy + 10}" r="1.3"/></g></g>
      <circle class="hand ol" cx="${m + 26}" cy="${iy + 28}" r="5"/></g>
    <g class="it it-fuu"><g class="tug"><path d="M${m - 26} ${iy + 28} Q${m - 30} ${iy - 4} ${m - 42} ${iy - 30}" fill="none" stroke="#5b4a42" stroke-width="1.3"/>
        <ellipse class="c2 ol2" cx="${m - 44}" cy="${iy - 44}" rx="12.5" ry="15"/><path class="c2 ol2" d="M${m - 46} ${iy - 29.5} l4 0 l-1 4 l-3 0 z"/>
        <ellipse cx="${m - 48.5}" cy="${iy - 50}" rx="3" ry="5.5" fill="#fff" opacity=".6" transform="rotate(20 ${m - 48.5} ${iy - 50})"/></g>
      <circle class="hand ol" cx="${m - 26}" cy="${iy + 28}" r="5"/></g>
    <g class="it it-nui"><g stroke="#5b4a42" stroke-width="1.6" stroke-linejoin="round"><ellipse cx="${m}" cy="${iy + 37}" rx="8.5" ry="7" fill="#d9a679"/><circle cx="${m - 6.5}" cy="${iy + 19}" r="3.4" fill="#d9a679"/><circle cx="${m + 6.5}" cy="${iy + 19}" r="3.4" fill="#d9a679"/>
        <circle cx="${m}" cy="${iy + 25.5}" r="8.6" fill="#e3b78c"/><ellipse cx="${m}" cy="${iy + 28}" rx="3.6" ry="2.8" fill="#fff3e6" stroke-width="1"/></g>
      <circle cx="${m - 3.2}" cy="${iy + 24}" r="1.2" fill="#3A322D"/><circle cx="${m + 3.2}" cy="${iy + 24}" r="1.2" fill="#3A322D"/><circle cx="${m}" cy="${iy + 27.4}" r="1" fill="#3A322D"/>
      <circle class="hand ol" cx="${m - 11}" cy="${iy + 34}" r="5"/><circle class="hand ol" cx="${m + 11}" cy="${iy + 34}" r="5"/></g>
    <g class="it it-hana"><g class="wave"><path d="M${m + 26} ${iy + 28} Q${m + 27} ${iy + 14} ${m + 34} ${iy + 4}" fill="none" stroke="#5e9a55" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M${m + 28} ${iy + 17} q8 -5 10 2 q-6 4 -10 -2 z" fill="#8cc47f" stroke="#5b4a42" stroke-width="1.2"/>
        <g transform="translate(${m + 35} ${iy + 1})">${[0, 72, 144, 216, 288].map(a => `<ellipse class="c2 ol2" cx="0" cy="-6.5" rx="4.4" ry="5.6" transform="rotate(${a})" style="stroke-width:1.4"/>`).join("")}<circle r="3.6" fill="#F2C94C" stroke="#8a6420" stroke-width="1.3"/></g></g>
      <circle class="hand ol" cx="${m + 26}" cy="${iy + 28}" r="5"/></g>
    <g class="it it-hon"><path class="c2 ol2" d="M${m - 19} ${iy + 20} L${m} ${iy + 24} L${m + 19} ${iy + 20} L${m + 19} ${iy + 38} L${m} ${iy + 42} L${m - 19} ${iy + 38} Z"/>
      <path d="M${m - 16.5} ${iy + 20} Q${m - 8} ${iy + 18} ${m} ${iy + 22.5} V${iy + 39.5} Q${m - 8} ${iy + 35} ${m - 16.5} ${iy + 37} Z M${m + 16.5} ${iy + 20} Q${m + 8} ${iy + 18} ${m} ${iy + 22.5} V${iy + 39.5} Q${m + 8} ${iy + 35} ${m + 16.5} ${iy + 37} Z" fill="#fffaf0" stroke="#5b4a42" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M${m - 13} ${iy + 25} l9 2 M${m - 13} ${iy + 29} l9 2 M${m + 4} ${iy + 27} l9 -2 M${m + 4} ${iy + 31} l9 -2" class="ink" style="stroke-width:1.1;opacity:.4"/>
      <circle class="hand ol" cx="${m - 20}" cy="${iy + 31}" r="5"/><circle class="hand ol" cx="${m + 20}" cy="${iy + 31}" r="5"/></g>
    <g class="it it-nigi"><path d="M${m} ${iy + 16} Q${m + 4} ${iy + 16} ${m + 13} ${iy + 33} Q${m + 15} ${iy + 38} ${m + 9} ${iy + 38} H${m - 9} Q${m - 15} ${iy + 38} ${m - 13} ${iy + 33} Q${m - 4} ${iy + 16} ${m} ${iy + 16} Z" fill="#fffdf6" stroke="#5b4a42" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M${m - 6} ${iy + 28} H${m + 6} V${iy + 38} H${m - 6} Z" fill="#3b4a3a" stroke="#2a332a" stroke-width="1"/><path d="M${m + 3} ${iy + 17.5} q5 -1 5 4 q-4 0 -5 -4 z" fill="#f4efe2" stroke="#5b4a42" stroke-width="1"/>
      <circle class="hand ol" cx="${m - 13}" cy="${iy + 33}" r="5"/><circle class="hand ol" cx="${m + 13}" cy="${iy + 33}" r="5"/></g>
    <ellipse class="tongue" cx="${m - 3}" cy="${imy + 2.5}" rx="3.4" ry="2.6" fill="#f29aa2" stroke="#3A322D" stroke-width="1.2"/>
    <g class="it it-ame"><g class="lick"><path d="M${m - 12} ${imy + 4} L${m - 24} ${iy + 29}" stroke="#fff8ee" stroke-width="3.2" stroke-linecap="round"/><path d="M${m - 12} ${imy + 4} L${m - 24} ${iy + 29}" stroke="#5b4a42" stroke-width="1" stroke-dasharray="0" fill="none" opacity=".35"/>
        <circle cx="${m - 12}" cy="${imy + 3}" r="8.2" fill="#fff" stroke="#5b4a42" stroke-width="1.8"/>
        <path d="M${m - 12} ${imy + 3} m0 -1.2 a2.4 2.4 0 1 1 -2.4 2.4 a4.6 4.6 0 1 1 4.6 4.6 a6.6 6.6 0 0 1 -6.6 -6.6" fill="none" style="stroke:var(--c2)" stroke-width="2.4" stroke-linecap="round"/></g>
      <circle class="hand ol" cx="${m - 24}" cy="${iy + 29}" r="5"/></g>`;
  };
  const shade = (id, d) =>
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient></defs><path d="${d}" fill="url(#${id})"/>`;
  const svg = (fc, hand, inner, fk = 4) =>
    `<svg class="vf" viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg" style="--fc:${fc};--hand:${hand};--fk:${fk}"><g class="art">${inner}</g></svg>`;
  const circles = (list, cls, extra) => list.map(([x, y, r]) => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}" ${extra || ""}/>`).join("");
  const cloud = (x, y, k, cls) =>
    `<g class="puff ${cls}"><g class="c1 ol" style="stroke-width:1.6">${[
      [0, 0, 5],
      [-5, 2, 3.6],
      [5, 2, 3.8],
      [1, -3, 3.6],
    ]
      .map(([dx, dy, r]) => `<circle cx="${x + dx * k}" cy="${y + dy * k}" r="${r * k}"/>`)
      .join("")}</g><g class="c1">${[
      [0, 0, 5],
      [-5, 2, 3.6],
      [5, 2, 3.8],
      [1, -3, 3.6],
    ]
      .map(([dx, dy, r]) => `<circle cx="${x + dx * k}" cy="${y + dy * k}" r="${r * k - 0.9}"/>`)
      .join("")}</g></g>`;

  // くらげ(左向き): 大きな かさ(もよう と 王冠)の下に顔、長い足が ゆらゆら。うしろに あわが残る
  const CAP =
    "M26 66 C24 32 48 16 80 16 C112 16 136 32 134 66 C135 74 127 76 123 69 Q115 80 106 69 Q98 80 89 69 Q80 80 71 69 Q62 80 54 69 Q45 80 37 69 C33 76 25 74 26 66 Z";
  const leg = (x, dx, len, cls, y0 = 94, w = 5.4) => {
    // 根もと(かさ・顔の近く)が太く、先にいくほど細い。まんなかの線を ゆるく波うたせる
    const L = [],
      R = [],
      n = 14;
    for (let k = 0; k <= n; k++) {
      const t = k / n,
        cx = x + dx * Math.sin(t * Math.PI * 1.6),
        hw = w * Math.pow(1 - t, 0.85) + 0.9,
        y = y0 + len * t;
      L.push(`${(cx - hw).toFixed(1)} ${y.toFixed(1)}`);
      R.push(`${(cx + hw).toFixed(1)} ${y.toFixed(1)}`);
    }
    return `<g class="sway ${cls}"><path class="k2 ol2" d="M${L.join(" L")} L${R.reverse().join(" L")} Z"/></g>`;
  };
  const KURAGE = svg(
    "color-mix(in srgb,var(--c1) 10%,#FFF3E6)",
    "color-mix(in srgb,var(--c1) 10%,#FFF3E6)",
    `<g class="rear" style="transform-origin:80px 70px"><g class="bob"><circle cx="143" cy="92" r="4.5" fill="#fff" fill-opacity=".5" class="ol" style="stroke-width:1.6"/></g><g class="bob b"><circle cx="151" cy="104" r="2.8" fill="#fff" fill-opacity=".5" class="ol" style="stroke-width:1.6"/></g></g>
     <g class="lean">${[
       [34, 6, 62, "c"],
       [45, -6, 72, ""],
       [56, 7, 70, "b"],
       [67, -6, 78, "c"],
       [78, 6, 72, ""],
       [89, -7, 78, "b"],
       [100, 6, 70, "c"],
       [111, -6, 72, ""],
       [122, 6, 62, "b"],
     ]
       .map(([x, dx, len, c]) => leg(x, dx, len, c, 66, 4.6))
       .join("")}</g>
     <g class="facing"><ellipse class="fc ol" cx="78" cy="78" rx="35" ry="22"/></g>
     <g class="pulse"><path class="k1 ol" d="${CAP}"/>
       <ellipse class="c2" cx="80" cy="38" rx="10.5" ry="7.5" opacity=".92"/><circle class="c2" cx="57" cy="41" r="4.6" opacity=".92"/><circle class="c2" cx="103" cy="36" r="5.2" opacity=".92"/><circle class="c2" cx="118" cy="52" r="3.2" opacity=".92"/>
       <g stroke="#8a6420" stroke-width="1.6" stroke-linejoin="round"><path d="M68 18 L66 4 L73 11 L80 1 L87 11 L94 4 L92 18 Z" fill="#F2C94C"/><circle cx="66" cy="4" r="2.3" fill="#fff6c9"/><circle cx="80" cy="1.8" r="2.5" fill="#fff6c9"/><circle cx="94" cy="4" r="2.3" fill="#fff6c9"/></g></g>
     <g class="facing">${face("ku", 61, 95, 83, "u")}</g>`,
    2.5,
  );

  // ひつじ(左向き): 横長の もこもこ。右上に とがった しっぽ(体とひとつづき)。うしろに 雲が残る
  const hornPath = (cx, cy, a0, a1, r0, r1, w0, w1) => {
    const o = [],
      i = [],
      rid = [],
      n = 46;
    for (let k = 0; k <= n; k++) {
      const t = k / n,
        a = ((a0 + (a1 - a0) * t) * Math.PI) / 180,
        r = r0 + (r1 - r0) * t,
        w = (w0 + (w1 - w0) * t) / 2,
        c = Math.cos(a),
        s2 = Math.sin(a);
      const po = [cx + (r + w) * c, cy + (r + w) * s2],
        pi = [cx + (r - w) * c, cy + (r - w) * s2];
      o.push(po);
      i.push(pi);
      if (k % 5 === 3 && k < n * 0.62) rid.push(`M${pi.map(v => v.toFixed(1)).join(" ")} L${po.map(v => v.toFixed(1)).join(" ")}`);
    }
    const pts = a => a.map(p => p.map(v => v.toFixed(1)).join(" ")).join(" L");
    return [`M${pts(o)} L${pts(i.reverse())} Z`, rid.join(" ")];
  };
  const [HORN, RIDGE] = hornPath(33, 64, -35, -470, 20, 3.2, 21, 6.4); // 太くして、巻きのあいだ と まんなかに すきまを作らない
  const horn = flip =>
    `<g ${flip ? 'transform="translate(156 0) scale(-1 1)"' : ""}><path class="c2 ol2" d="${HORN}"/><path d="${RIDGE}" fill="none" stroke="#5b4a42" stroke-width="1.3" stroke-linecap="round" opacity=".45"/></g>`;
  const WOOL = [
    [78, 44, 25],
    [50, 50, 20],
    [106, 50, 20],
    [34, 70, 19],
    [122, 70, 19],
    [50, 93, 20],
    [78, 99, 21],
    [106, 93, 20],
    [58, 70, 28],
    [98, 70, 28],
    [78, 70, 32],
  ];
  const TAIL = "M108 48 C114 32 124 22 136 15 C136 30 132 44 122 58 Z";
  const FRINGE = [
    [51, 59, 9.5],
    [63, 55, 9.5],
    [76, 54, 9.5],
    [88, 55, 9.5],
    [100, 59, 9.5],
  ];
  const HITSUJI = svg(
    "#FFF3E6",
    "var(--c1)",
    `<g class="rear"><g class="bob"><circle class="c1 ol" cx="139" cy="108" r="6.5"/></g><g class="bob b"><circle class="c1 ol" cx="151" cy="99" r="3.4"/></g></g>
     <g class="pulse"><g class="rear"><path class="c1 ol wag" style="stroke-width:4" d="${TAIL}"/></g>${circles(WOOL, "c1 ol", 'style="stroke-width:4"')}<g class="rear"><path class="c1 wag" d="${TAIL}"/></g>${circles(WOOL, "c1")}
       <ellipse cx="80" cy="106" rx="34" ry="9" fill="#000" opacity=".05"/></g>
     <g class="facing"><rect class="fc" x="46" y="53" width="60" height="45" rx="21" stroke="#5b4a42" stroke-width="1.8"/>
     ${circles(FRINGE, "c1 ol")}${circles(
       FRINGE.map(([x, y, r]) => [x, y - 2.8, r]),
       "c1",
     )}</g>
     ${horn(false)}${horn(true)}
     <g class="facing">${face("hi", 61, 91, 76, "w")}</g>`,
  );
  // うしろ姿(svg に vb のしるし)。顔がなく、くらげは かさと足、ひつじは もこもこと しっぽ
  const back = inner => `<svg class="vb" viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg"><g class="art">${inner}</g></svg>`;
  const KURAGE_B =
    back(`<g class="rear" style="transform-origin:80px 70px"><g class="bob"><circle cx="143" cy="92" r="4.5" fill="#fff" fill-opacity=".5" class="ol" style="stroke-width:1.6"/></g><g class="bob b"><circle cx="151" cy="104" r="2.8" fill="#fff" fill-opacity=".5" class="ol" style="stroke-width:1.6"/></g></g>
     <g class="lean">${[
       [34, 6, 62, "c"],
       [45, -6, 72, ""],
       [56, 7, 70, "b"],
       [67, -6, 78, "c"],
       [78, 6, 72, ""],
       [89, -7, 78, "b"],
       [100, 6, 70, "c"],
       [111, -6, 72, ""],
       [122, 6, 62, "b"],
     ]
       .map(([x, dx, len, c]) => leg(x, dx, len, c, 66, 4.6))
       .join("")}</g>
     <g class="pulse"><path class="k1 ol" d="${CAP}"/>
       <ellipse class="c2" cx="74" cy="44" rx="11" ry="8" opacity=".92"/><circle class="c2" cx="100" cy="36" r="5" opacity=".92"/><circle class="c2" cx="52" cy="34" r="5.4" opacity=".92"/><circle class="c2" cx="42" cy="54" r="3.4" opacity=".92"/><circle class="c2" cx="112" cy="56" r="4" opacity=".92"/><circle class="c2" cx="88" cy="58" r="3" opacity=".92"/>
       <g stroke="#8a6420" stroke-width="1.6" stroke-linejoin="round"><path d="M68 18 L66 4 L73 11 L80 1 L87 11 L94 4 L92 18 Z" fill="#F2C94C"/><circle cx="66" cy="4" r="2.3" fill="#fff6c9"/><circle cx="80" cy="1.8" r="2.5" fill="#fff6c9"/><circle cx="94" cy="4" r="2.3" fill="#fff6c9"/></g></g>`);
  const curl = (x, y, f) =>
    `<path d="M${x} ${y} q${5 * f} -7 ${11 * f} -2 q${3 * f} 5 ${-3 * f} 7" class="ink" style="stroke:#5b4a42;stroke-width:1.5;opacity:.45"/>`;
  const HITSUJI_B =
    back(`<g class="rear"><g class="bob"><circle class="c1 ol" cx="139" cy="108" r="6.5"/></g><g class="bob b"><circle class="c1 ol" cx="151" cy="99" r="3.4"/></g></g>
     ${horn(false)}${horn(true)}
     <g class="pulse"><g class="rear"><path class="c1 ol wag" style="stroke-width:4" d="${TAIL}"/></g>${circles(WOOL, "c1 ol", 'style="stroke-width:4"')}<g class="rear"><path class="c1 wag" d="${TAIL}"/></g>${circles(WOOL, "c1")}
       ${curl(52, 58, 1)}${curl(86, 54, 1)}${curl(66, 78, -1)}${curl(100, 80, 1)}${curl(48, 90, 1)}${curl(84, 100, -1)}
       <ellipse cx="80" cy="106" rx="34" ry="9" fill="#000" opacity=".05"/></g>`);

  // ハシビロコウ(左向き): 大きな頭に、くつの形の くちばし。じとっとした目(まぶたが深い)。細い足を ぶらさげて浮く。うれしいと くちばしを カタカタ鳴らす
  const BILL = "M45 55 C44 46 55 43 66 45 C77 43 89 46 88 55 C90 69 80 82 68 84 C66 90 61 91 59 85 C50 83 43 69 45 55 Z";
  const birdLeg = (
    x,
    cls,
  ) => `<g class="sway ${cls}"><path d="M${x} 104 V136" class="ink" style="stroke:#5b4a42;stroke-width:5.4"/><path d="M${x} 104 V136" style="stroke:var(--c2);stroke-width:2.8;stroke-linecap:round;fill:none"/>
    <path class="c2 ol2" style="stroke-width:1.6" d="M${x - 10} 142 Q${x - 4} 133 ${x} 136 Q${x + 5} 133 ${x + 9} 142 Q${x + 4} 139 ${x + 1} 142 Q${x - 2} 138 ${x - 5} 142 Q${x - 8} 139 ${x - 10} 142 Z"/></g>`;
  const BIRD = [
    [68, 50, 29],
    [84, 86, 31],
    [78, 68, 24],
  ]; // 頭・体・くび(ひとつづきの形にする)
  const CREST = "M88 30 C92 18 100 14 104 12 C102 20 100 26 98 32 C104 24 110 22 113 22 C109 28 104 34 98 38 Z";
  const BTAIL = "M110 92 C120 90 130 94 136 102 C128 102 124 106 116 106 Z";
  const HASHI = svg(
    "color-mix(in srgb,var(--c1) 88%,#fff)",
    "var(--c1)",
    `<g class="rear" style="transform-origin:80px 70px"><g class="bob"><circle class="c1 ol" cx="142" cy="74" r="4.6"/></g><g class="bob b"><circle class="c1 ol" cx="151" cy="64" r="2.6"/></g></g>
     <g class="lean">${birdLeg(74, "")}${birdLeg(94, "b")}</g>
     <g class="pulse"><g class="rear" style="transform-origin:80px 70px"><path class="c1 ol" style="stroke-width:4" d="${BTAIL}"/><path class="c1 ol" style="stroke-width:4" d="${CREST}"/></g>${circles(BIRD, "c1 ol", 'style="stroke-width:4"')}
       <g class="rear" style="transform-origin:80px 70px"><path class="c1" d="${BTAIL}"/><path class="c1" d="${CREST}"/></g>${circles(BIRD, "c1")}
       <ellipse cx="86" cy="96" rx="19" ry="15" fill="#fff" opacity=".28"/>
       <g class="flapS"><path class="c1 ol" d="M100 72 C114 72 120 86 116 100 C108 102 100 96 98 86 Z"/><path d="M104 82 q5 4 8 10 M102 88 q4 3 6 8" class="ink" style="stroke:#5b4a42;stroke-width:1.3;opacity:.4"/></g></g>
     <g class="facing"><g class="clat"><path class="c2 ol2" d="${BILL}"/>
       <path d="M47 62 C56 71 78 71 87 62" class="ink" style="stroke:#5b4a42;stroke-width:1.8;opacity:.75"/><path d="M66 47 V66" class="ink" style="stroke:#5b4a42;stroke-width:1.2;opacity:.3"/>
       <circle cx="60" cy="53" r="1.3" fill="#5b4a42" opacity=".6"/><circle cx="72" cy="53" r="1.3" fill="#5b4a42" opacity=".6"/>
       <ellipse cx="56" cy="50" rx="5" ry="2.4" fill="#fff" opacity=".4" transform="rotate(-12 56 50)"/></g>
     ${face("ha", 52, 82, 38, "none", 70)}</g>`,
    3,
  ).replace('style="--fc', 'style="--lid0:-9px;--fc');
  const HASHI_B =
    back(`<g class="rear" style="transform-origin:80px 70px"><g class="bob"><circle class="c1 ol" cx="142" cy="74" r="4.6"/></g><g class="bob b"><circle class="c1 ol" cx="151" cy="64" r="2.6"/></g></g>
     <g class="lean">${birdLeg(74, "")}${birdLeg(94, "b")}</g>
     <path class="c2 ol2" d="M46 58 C40 56 38 64 44 68 C48 68 50 64 50 60 Z"/>
     <g class="pulse"><g class="rear" style="transform-origin:80px 70px"><path class="c1 ol" style="stroke-width:4" d="${BTAIL}"/><path class="c1 ol" style="stroke-width:4" d="${CREST}"/></g>${circles(BIRD, "c1 ol", 'style="stroke-width:4"')}
       <g class="rear" style="transform-origin:80px 70px"><path class="c1" d="${BTAIL}"/><path class="c1" d="${CREST}"/></g>${circles(BIRD, "c1")}
       <path d="M70 80 q8 6 18 4 M66 92 q10 7 24 4 M72 104 q8 4 16 2" class="ink" style="stroke:#5b4a42;stroke-width:1.5;opacity:.4"/>
       <path d="M58 40 q8 -6 18 -2" class="ink" style="stroke:#5b4a42;stroke-width:1.5;opacity:.35"/></g>`);
  const KINDS = {
    yura: {name: "ゆらゆらさん", art: KURAGE + KURAGE_B, col: ["#8FD3C9", "#F2A7B5"]},
    moku: {name: "もくもくさん", art: HITSUJI + HITSUJI_B, col: ["#8FD3C9", "#F2A7B5"]},
    hashi: {name: "ハシビロさん", art: HASHI + HASHI_B, col: ["#A9BCCB", "#E8CF9A"], p: {speed: 0.55, pace: 2.3, talk: 0.5}, draft: true}, // じっとしているのが好き。名前は仮。
    // draft: まだ ためしの子。せっていにも入口にも出さず、ためしの紙(yousei-tameshi.html)だけに出る。出すときは draft を消す
  };
  const ITEMS = [
    ["mara", "🪇 マラカス"],
    ["ame", "🍭 あめ"],
    ["kasa", "☂️ かさ"],
    ["mafu", "🧣 マフラー"],
    ["mug", "☕ マグ"],
    ["sute", "🌟 ステッキ"],
    ["fuu", "🎈 ふうせん"],
    ["nui", "🧸 ぬいぐるみ"],
    ["hana", "🌼 おはな"],
    ["hon", "📖 えほん"],
    ["nigi", "🍙 おにぎり"],
  ];
  const MOODS = ["ふつう", "さむい", "ねむい", "うれしい"],
    MOOD_CLS = ["", "s-cold", "s-sleep", "s-happy"];
  const WORDS = [
    ["◡ ‥", "♪ ‥", "？ ☀ ‥", "？ ∿", "◡ ♨"],
    ["〰 ❄ ‥‥", "〰 ‥", "？ ♨"],
    ["☾ ‥", "‥"],
    ["♪ ✿ ！", "♪ ♪", "！ ☀"],
  ];
  const PALETTE = [
    ["#8FD3C9", "#F2A7B5", "#BFD9F2", "#F6D58A", "#C9B8EE", "#F7C1A1", "#FFFFFF", "#B9E3A8"],
    ["#F2A7B5", "#F6D58A", "#8FD3C9", "#C9B8EE", "#F28B6B", "#7FB2E5", "#FFFFFF", "#6E625A"],
  ]; // からだ・かざり の えらびやすい色
  const PARAMS = [
    ["size", "おおきさ", 0.45, 1.1, 0.7],
    ["speed", "うごく速さ", 0.3, 2.5, 1],
    ["pace", "のんびり度", 0.3, 3, 1],
    ["talk", "おしゃべり", 0, 2.5, 1],
  ];

  // 色のグラデーションは、ひとりずつ自分の svg の中に持つ(色を ひとりずつ変えられるように)
  let uid = 0;
  const defs = id => `<defs>
    <linearGradient id="${id}g1" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="124"><stop offset="0" style="stop-color:color-mix(in srgb,var(--c1) 82%,#fff)"/><stop offset=".5" style="stop-color:var(--c1)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--c1) 50%,var(--c2))"/></linearGradient>
    <linearGradient id="${id}g2" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="132"><stop offset="0" style="stop-color:color-mix(in srgb,var(--c2) 70%,#fff)"/><stop offset=".55" style="stop-color:var(--c2)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--c2) 62%,var(--c1))"/></linearGradient>
    <linearGradient id="${id}g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--c1) 70%,#fff)"/><stop offset=".45" style="stop-color:var(--c1)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--c1) 35%,var(--c2))"/></linearGradient>
    <linearGradient id="${id}g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--c2) 55%,var(--c1))"/><stop offset=".45" style="stop-color:var(--c2)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--c2) 45%,#fff)"/></linearGradient></defs>`;
  function body(kind) {
    // ひとりぶんの絵(まえ と うしろ姿)。目のくりぬき と グラデーションの名前を、ひとりずつ別にする
    const id = "ys" + ++uid,
      me = el("div", "me"),
      turn = el("div", "turn");
    turn.innerHTML = KINDS[kind].art.replace(/(id="|url\(#)(ku|hi|ha)/g, "$1" + id);
    turn.querySelectorAll("svg").forEach((s, n) => {
      s.insertAdjacentHTML("afterbegin", defs(id + n));
      for (let g = 1; g <= 4; g++) s.style.setProperty("--g" + g, `url(#${id}${n}g${g})`);
    });
    me.append(turn, el("span", "z", "z"), el("span", "spk a", "✦"), el("span", "spk b", "✦"));
    return me;
  }
  function handFilter() {
    // 手がきっぽい いびつさ(動かさない)。ページに1つだけ置く
    if (document.getElementById("ys-hand")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="ys-hand" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="2"/><feDisplacementMap in="SourceGraphic" scale="3.4"/></filter></defs></svg>`,
    );
  }

  // ---------------- 設定(この端末だけ) ----------------
  const KEY = "gojiai-yousei-cfg" + (seg => (seg && seg !== "gojiai" && !seg.includes(".") ? "@" + seg : ""))(location.pathname.split("/")[1] || ""),
    HEX = /^#[0-9a-f]{6}$/i;
  function load() {
    const c = {on: {}, col: {}, p: {}, item: {}};
    let d = {};
    try {
      d = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (e) {}
    let old = null;
    try {
      const a = localStorage.getItem("gojiai-yousei-c1"),
        b = localStorage.getItem("gojiai-yousei-c2");
      if (HEX.test(a || "") && HEX.test(b || "")) old = [a, b];
    } catch (e) {} // 案の紙で選んだ色
    for (const k of Object.keys(KINDS)) {
      c.on[k] = !KINDS[k].draft && !!(d.on && d.on[k]);
      const v = d.col && d.col[k];
      c.col[k] = Array.isArray(v) && v.length === 2 && v.every(x => HEX.test(x)) ? v : (old || KINDS[k].col).slice();
      const it = d.item && d.item[k];
      c.item[k] = ITEMS.some(i => i[0] === it) ? it : "";
    }
    for (const k of Object.keys(KINDS)) {
      // うごきは ひとりずつ。前は みんなで1つだった(d.p.size …)ので、あれば それを ひきつぐ
      const mine = d.p && d.p[k] && typeof d.p[k] === "object" ? d.p[k] : d.p || {};
      c.p[k] = {};
      for (const [q, , lo, hi, def] of PARAMS) {
        const v = Number(mine[q]);
        c.p[k][q] = d.p && d.p[k] && v >= lo && v <= hi ? v : KINDS[k].p && KINDS[k].p[q] != null ? KINDS[k].p[q] : v >= lo && v <= hi ? v : def;
      }
    }
    return c;
  }
  const save = c => {
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch (e) {}
  };
  const anyOn = c => Object.values((c || load()).on).some(Boolean);

  // ---------------- 動き ----------------
  // layer: 子を置く箱(position が付いていること)。opt: {cfg, only(出す子を名指し。ためしの紙用), pose("front"・"back": まんなかで じっとさせる), names(名札を出す), spots() → 休める四角の要素, mood() → 0..3, bottom(下の使わない高さ), calm(おしゃべりの間を何倍にするか), onGive(cfg)}
  // することを ときどき選ぶ: うろうろ / 上にいく / 四角の上で休む / こっちに来る(大きくなる) / うしろを向いて遠くへ(小さくなる)。ねむいは じっとする。さむいは 少しだけ ちょこちょこ動いて、止まって ぶるぶる を くりかえす。
  function mount(layer, opt) {
    handFilter();
    let cfg = opt.cfg || load(),
      actors = [],
      alive = true,
      last = performance.now(),
      force = null;
    const P = A => cfg.p[A.kind],
      mood = () => (force != null ? force : opt.mood ? opt.mood() : 0);
    const rnd = (a, b) => a + Math.random() * (b - a),
      pickOne = a => a[Math.floor(Math.random() * a.length)];
    const BW = 118,
      BH = 103,
      OY = BH * 0.6;
    const size = () => ({W: layer.clientWidth, H: layer.clientHeight - (opt.bottom || 0)});
    // 箱からはみ出さない場所に直す(大きさ k = その子の おおきさ × いまの寄り具合 を見こむ)
    const fit = (A, x, y, ts) => {
      const {W, H} = size(),
        k = P(A).size * ts,
        hw = (BW * k) / 2,
        x0 = hw - BW / 2 + 3,
        x1 = W - hw - BW / 2 - 3,
        y0 = 6 - OY + OY * k,
        y1 = H - 4 - OY - (BH - OY + 9) * k;
      return [x1 < x0 ? (W - BW) / 2 : Math.max(x0, Math.min(x1, x)), y1 < y0 ? (H - BH) / 2 : Math.max(y0, Math.min(y1, y))];
    };
    const hold = (A, k) => {
      for (const [x] of ITEMS) A.act.classList.toggle("it-" + x, x === k);
    };
    const poke = A => {
      A.me.classList.remove("poke");
      void A.me.offsetWidth;
      A.me.classList.add("poke");
      setTimeout(() => A.me.classList.remove("poke"), 520);
    };
    function speak(A, words) {
      A.say.textContent = pickOne(words || WORDS[mood()]);
      A.say.classList.add("on");
      clearTimeout(A.st);
      A.st = setTimeout(() => A.say.classList.remove("on"), 2600);
    }
    function paint(A) {
      A.act.style.setProperty("--c1", cfg.col[A.kind][0]);
      A.act.style.setProperty("--c2", cfg.col[A.kind][1]);
      hold(A, cfg.item[A.kind]);
    }
    function add(kind) {
      const {W, H} = size(),
        act = el("div", "ys"),
        me = body(kind),
        say = el("div", "say");
      act.append(me, say);
      layer.append(act);
      if (opt.names) act.append(el("div", "tag", KINDS[kind].name));
      const A = {
        kind,
        act,
        me,
        say,
        x: rnd(0, Math.max(1, W - BW)),
        y: rnd(10, Math.max(20, H - 200)),
        s: 1,
        ts: 1,
        dir: Math.random() < 0.5 ? 1 : -1,
        mode: "wander",
        hold: 0,
        happy: 0,
        nextSay: performance.now() + rnd(4000, 9000) * (opt.calm || 1),
      };
      A.tx = A.x;
      A.ty = A.y;
      paint(A);
      let down = null;
      act.onpointerdown = ev => {
        ev.preventDefault();
        ev.stopPropagation();
        act.setPointerCapture(ev.pointerId);
        down = {px: ev.clientX, py: ev.clientY, x: A.x, y: A.y, lx: ev.clientX, moved: false};
      };
      act.onpointermove = ev => {
        // つまんで動かす
        if (!down) return;
        const dx = ev.clientX - down.px,
          dy = ev.clientY - down.py,
          {W, H} = size();
        if (!down.moved && Math.hypot(dx, dy) < 6) return;
        if (!down.moved) {
          down.moved = true;
          A.mode = "drag";
          act.classList.add("drag");
          act.classList.remove("back", "sit");
        }
        if (Math.abs(ev.clientX - down.lx) > 2) {
          A.dir = ev.clientX > down.lx ? 1 : -1;
          down.lx = ev.clientX;
        }
        [A.x, A.y] = fit(A, down.x + dx, down.y + dy, 1);
        A.tx = A.x;
        A.ty = A.y;
      };
      act.onpointerup = act.onpointercancel = () => {
        if (!down) return;
        const moved = down.moved;
        down = null;
        act.classList.remove("drag", "back", "sit");
        A.mode = "touch";
        A.arrived = false;
        A.tx = A.x;
        A.ty = A.y;
        A.ts = moved ? 1 : 1.12;
        A.hold = performance.now() + (moved ? 1200 : 1900) * P(A).pace;
        if (!moved) {
          poke(A);
          if (Math.random() < 0.5 && P(A).talk > 0) speak(A);
        } // さわっただけ: こっちを向いて ぷるん。ときどき ひとこと
      };
      act.onclick = ev => {
        ev.preventDefault();
        ev.stopPropagation();
      }; // 下にあるアプリの四角を 押したことにしない
      actors.push(A);
    }
    function sync() {
      // 住んでいる子を、設定に合わせる
      const want = Object.keys(KINDS).filter(k => (opt.only ? opt.only.includes(k) : cfg.on[k]));
      for (const A of actors.filter(a => !want.includes(a.kind))) {
        A.act.remove();
        clearTimeout(A.st);
      }
      actors = actors.filter(a => want.includes(a.kind));
      for (const k of want) if (!actors.some(a => a.kind === k)) add(k);
      actors.forEach(paint);
    }
    function choose(A) {
      const {W, H} = size(),
        k = P(A).size;
      A.act.classList.remove("back", "sit");
      A.ts = 1;
      if (mood() === 1 && performance.now() >= A.happy) {
        A.mode = "cold";
        A.tx = A.x + rnd(20, 60) * (Math.random() < 0.5 ? -1 : 1);
        A.ty = A.y + rnd(-15, 15);
        [A.tx, A.ty] = fit(A, A.tx, A.ty, 1);
        return;
      } // さむい: ちょっとだけ
      const r = Math.random(),
        spots = r >= 0.48 && r < 0.68 && opt.spots ? opt.spots().filter(e => e.getBoundingClientRect().width > 0) : [];
      if (r < 0.34 || (r >= 0.48 && r < 0.68 && !spots.length)) {
        A.mode = "wander";
        A.tx = rnd(0, W - BW);
        A.ty = rnd(10, H - 180);
      } else if (r < 0.48) {
        A.mode = "up";
        A.tx = rnd(0, W - BW);
        A.ty = rnd(-14, 6);
      } else if (r < 0.68) {
        A.mode = "rest";
        const a = layer.getBoundingClientRect(),
          b = pickOne(spots).getBoundingClientRect();
        A.tx = b.left - a.left + b.width / 2 - BW / 2;
        A.ty = b.top - a.top - (OY + (88 - OY) * k) - 3;
        if (A.ty < -20 || A.ty > H - 60) {
          A.mode = "wander";
          A.tx = rnd(0, W - BW);
          A.ty = rnd(10, H - 180);
        }
      } else if (r < 0.84) {
        A.mode = "come";
        A.tx = rnd(W * 0.2, Math.max(W * 0.2, W * 0.8 - BW));
        A.ty = Math.max(20, H - 190);
        A.ts = 1.3;
      } else {
        A.mode = "away";
        A.tx = rnd(0, W - BW);
        A.ty = rnd(-6, 30);
        A.ts = 0.7;
        A.act.classList.add("back");
      }
      [A.tx, A.ty] = fit(A, A.tx, A.ty, A.ts);
    }
    function tick(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000),
        m = mood(),
        still = m === 2;
      last = now;
      for (const A of actors) {
        let moving = false;
        const mm = now < A.happy ? 3 : m;
        if (opt.pose) {
          // まんなかで じっとして、まえ か うしろを見せる
          const {W, H} = size();
          A.x = (W - BW) / 2;
          A.y = (H - BH) / 2;
          A.act.classList.toggle("back", opt.pose === "back");
          A.act.style.transform = `translate(${A.x}px,${A.y}px) scale(${(opt.scale || 1).toFixed(2)})`;
          A.act.style.setProperty("--dir", -1);
          continue;
        }
        if (A.mode !== "drag") [A.tx, A.ty] = fit(A, A.tx, A.ty, A.ts); // 箱の大きさや おおきさが変わっても、はみ出さない
        MOOD_CLS.forEach((c, i) => {
          if (c) A.act.classList.toggle(c, i === mm);
        });
        if (A.mode !== "drag" && (!still || A.mode === "touch")) {
          const dx = A.tx - A.x,
            dy = A.ty - A.y,
            d = Math.hypot(dx, dy),
            sp = (A.mode === "come" || A.mode === "away" ? 30 : 38) * P(A).speed * (mm === 3 ? 1.4 : A.mode === "cold" ? 0.45 : 1);
          if (d > 1.5) {
            const k = Math.min(1, (sp * dt) / d);
            A.x += dx * k;
            A.y += dy * k;
            moving = true;
            if (Math.abs(dx) > 3) A.dir = dx > 0 ? 1 : -1;
          } else if (!A.arrived && A.mode !== "touch") {
            // 着いた
            A.arrived = true;
            if (A.mode === "rest") {
              A.act.classList.add("sit");
              A.hold = now + rnd(4500, 8000) * P(A).pace;
            } else if (A.mode === "come") A.hold = now + rnd(2500, 4000) * P(A).pace;
            else if (A.mode === "cold")
              A.hold = now + rnd(3500, 7000) * P(A).pace; // 止まって ぶるぶる
            else if (A.mode === "away") A.hold = now + rnd(1800, 3000) * P(A).pace;
            else A.hold = now + rnd(600, 2200) * P(A).pace;
          }
          A.s += (A.ts - A.s) * Math.min(1, dt * 2.2);
          if ((A.arrived || A.mode === "touch") && now > A.hold) {
            A.arrived = false;
            A.hold = 0;
            choose(A);
          }
        } else if (still) A.act.classList.remove("back");
        if (now > A.nextSay) {
          if (P(A).talk > 0 && A.mode !== "away" && A.mode !== "drag" && m !== 2 && Math.random() < 0.7) speak(A);
          A.nextSay = now + (rnd(7000, 14000) * (opt.calm || 1)) / Math.max(0.15, P(A).talk);
        }
        A.act.style.transform = `translate(${A.x.toFixed(1)}px,${A.y.toFixed(1)}px) scale(${(A.s * P(A).size).toFixed(3)})`;
        A.act.style.zIndex = Math.round(A.s * 10);
        A.act.style.setProperty("--dir", A.dir);
        A.act.style.setProperty("--mv", moving ? 1 : 0);
        A.act.classList.toggle("mvg", moving);
      }
      requestAnimationFrame(tick);
    }
    function give(A, k) {
      // ものを あげる(その子だけ。持っていたものと 持ちかえる)。もらうと こっちを向いて よろこぶ
      cfg.item[A.kind] = k;
      hold(A, k);
      if (opt.onGive) opt.onGive(cfg);
      A.act.classList.remove("back", "sit", "drag");
      A.mode = "touch";
      A.arrived = false;
      A.tx = A.x;
      A.ty = A.y;
      A.ts = 1.15;
      A.hold = performance.now() + 2600 * P(A).pace;
      poke(A);
      if (k) {
        A.happy = performance.now() + 2400;
        speak(A, ["♪ ！", "♪ ♪", "♪ ✿ ！"]);
      }
    }
    const nearest = (cx, cy, max) => {
      let best = null,
        bd = max;
      for (const A of actors) {
        const r = A.act.getBoundingClientRect(),
          d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
        if (d < bd) {
          bd = d;
          best = A;
        }
      }
      return best;
    };
    sync();
    requestAnimationFrame(tick);
    return {
      set(c) {
        cfg = c;
        sync();
      },
      give,
      nearest,
      layer,
      mood(i) {
        force = i;
      },
      get actors() {
        return actors;
      },
      stop() {
        alive = false;
        for (const A of actors) A.act.remove();
        actors = [];
      },
    };
  }

  // お盆: 絵文字が1行に並ぶ(横になぞると流れる)。上へ つまんで、子の上で はなすと、その子が持つ。押すだけなら、お盆に近い子へ。✋ は かえしてもらう
  function tray(box, ctrl) {
    box.classList.add("ys-tray");
    box.textContent = "";
    for (const [k, t] of [["", "✋"], ...ITEMS]) {
      const e = [...t][0],
        b = el("button", null, e);
      b.type = "button";
      b.title = t;
      let g = null,
        moved = false,
        sx = 0,
        sy = 0;
      const drop = () => {
        if (g) g.remove();
        g = null;
      };
      b.onpointerdown = ev => {
        b.setPointerCapture(ev.pointerId);
        sx = ev.clientX;
        sy = ev.clientY;
        moved = false;
        drop();
        g = el("div", "ys-gift", e);
        g.style.left = sx + "px";
        g.style.top = sy + "px";
        g.hidden = true;
        document.body.append(g);
      };
      b.onpointermove = ev => {
        if (!g) return;
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
          moved = true;
          g.hidden = false;
        }
        g.style.left = ev.clientX + "px";
        g.style.top = ev.clientY + "px";
      };
      b.onpointerup = ev => {
        if (!g) return;
        drop();
        const r = box.getBoundingClientRect(),
          A = moved ? ctrl.nearest(ev.clientX, ev.clientY, 80) : ctrl.nearest(r.left + r.width / 2, r.top, 1e9);
        if (A) ctrl.give(A, k);
      };
      b.onpointercancel = drop; // 横になぞって お盆が流れたとき(あげない)
      box.append(b);
    }
  }

  return {KINDS, ITEMS, MOODS, PARAMS, PALETTE, load, save, anyOn, mount, tray};
})();
