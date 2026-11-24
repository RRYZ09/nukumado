// ぬくまど の はじめの 値(tools/build_lite.py が apps/cards_default.json と web/apps.json から 作る。手で 直さない)
self.LITE_DEFAULTS = {
 "cards": [
  {
   "id": "n1",
   "e": "🧦",
   "t": "くつしたをはく",
   "k": "nuku",
   "s": "cold"
  },
  {
   "id": "n2",
   "e": "🍵",
   "t": "白湯かあったかいお茶をいれる",
   "k": "nuku",
   "dry": true,
   "s": "cold"
  },
  {
   "id": "n3",
   "e": "🔥",
   "t": "暖房をつける(もう1℃上げてもいい)",
   "k": "nuku",
   "s": "cold"
  },
  {
   "id": "n4",
   "e": "🧣",
   "t": "もう1枚はおる",
   "k": "nuku",
   "s": "cold"
  },
  {
   "id": "n5",
   "e": "♨️",
   "t": "お湯で手を30秒あたためる",
   "k": "nuku",
   "s": "cold"
  },
  {
   "id": "n6",
   "e": "🫖",
   "t": "湯たんぽかカイロを用意する",
   "k": "nuku",
   "s": "cold"
  },
  {
   "id": "n7",
   "e": "🛁",
   "t": "お風呂にお湯をためる",
   "k": "nuku",
   "w": [
    "yoru",
    "neru"
   ],
   "s": "cold"
  },
  {
   "id": "g1",
   "e": "🍌",
   "t": "なにかひとくち食べる(バナナでもいい)",
   "k": "gohan"
  },
  {
   "id": "g2",
   "e": "🍲",
   "t": "あったかい汁ものをのむ",
   "k": "gohan",
   "s": "cold"
  },
  {
   "id": "g3",
   "e": "💧",
   "t": "水をコップ1ぱいのむ",
   "k": "nomi",
   "dry": true
  },
  {
   "id": "k1",
   "e": "🪟",
   "t": "窓をあけて、ゆっくり10回息をする",
   "k": "kibun",
   "air": true
  },
  {
   "id": "k2",
   "e": "🎵",
   "t": "好きな曲を1曲だけきく",
   "k": "kibun"
  },
  {
   "id": "k3",
   "e": "🤸",
   "t": "のびをして、肩をまわす",
   "k": "kibun"
  },
  {
   "id": "k5",
   "e": "🧹",
   "t": "机の上を1か所だけ片づける",
   "k": "kibun"
  },
  {
   "id": "k6",
   "e": "📵",
   "t": "スマホを別の部屋に置いて5分",
   "k": "kibun"
  },
  {
   "id": "k7",
   "e": "✍️",
   "t": "いまの気分を1行だけ書く",
   "k": "kibun"
  },
  {
   "id": "s1",
   "e": "☀️",
   "t": "ベランダか玄関の外で2分、光をあびる",
   "k": "soto",
   "w": [
    "asa",
    "hiru"
   ]
  },
  {
   "id": "s2",
   "e": "🚶",
   "t": "近所を5分だけ歩く",
   "k": "soto",
   "w": [
    "asa",
    "hiru"
   ]
  },
  {
   "id": "h1",
   "e": "💌",
   "t": "メッセージを1件だけ開いて読む(返事はしなくていい)",
   "k": "hito",
   "w": [
    "asa",
    "hiru",
    "yoru"
   ]
  },
  {
   "id": "h2",
   "e": "👍",
   "t": "だれかにスタンプだけ返す",
   "k": "hito",
   "w": [
    "asa",
    "hiru",
    "yoru"
   ]
  },
  {
   "id": "r1",
   "e": "🌙",
   "t": "部屋の電気を暗くする",
   "k": "neru",
   "w": [
    "neru"
   ]
  },
  {
   "id": "r2",
   "e": "🪥",
   "t": "歯をみがく",
   "k": "neru",
   "w": [
    "neru"
   ]
  },
  {
   "id": "r3",
   "e": "🛏️",
   "t": "スマホを充電器に置いて、ふとんに入る",
   "k": "neru",
   "w": [
    "neru"
   ]
  },
  {
   "id": "h01",
   "e": "🥤",
   "t": "つめたい水か麦茶をコップ1ぱいのむ",
   "k": "nomi",
   "s": "hot"
  },
  {
   "id": "h02",
   "e": "🧊",
   "t": "首やわきを冷やす(ぬれタオルでもいい)",
   "k": "kibun",
   "s": "hot"
  },
  {
   "id": "h03",
   "e": "❄️",
   "t": "冷房をつける(もう1℃下げてもいい)",
   "k": "kibun",
   "s": "hot"
  },
  {
   "id": "h04",
   "e": "👕",
   "t": "うすい服にきがえる",
   "k": "kibun",
   "s": "hot"
  },
  {
   "id": "h05",
   "e": "🚿",
   "t": "ぬるいシャワーをあびる",
   "k": "furo",
   "s": "hot",
   "w": [
    "yoru",
    "neru"
   ]
  },
  {
   "id": "h06",
   "e": "🌬️",
   "t": "風の通るところで5分やすむ",
   "k": "kibun",
   "s": "hot"
  },
  {
   "id": "h07",
   "e": "🧂",
   "t": "塩分のあるものをひとくち(梅干しや塩あめ)",
   "k": "gohan",
   "s": "hot"
  }
 ],
 "apps": [
  {
   "id": "gojiai",
   "e": "🌸",
   "t": "ごじあい",
   "c": "#B84E33",
   "pages": [
    {
     "id": "ima",
     "e": "🌸",
     "t": "いま",
     "u": "ima.html"
    },
    {
     "id": "stamps",
     "e": "📅",
     "t": "スタンプ帳",
     "u": "stamps.html"
    }
   ]
  },
  {
   "id": "hitoiki",
   "e": "🍵",
   "t": "ひといき",
   "c": "#5E8C6A",
   "pages": [
    {
     "id": "hitoiki",
     "e": "🍵",
     "t": "いま",
     "u": "hitoiki.html"
    },
    {
     "id": "hitoiki-timer",
     "e": "⏱️",
     "t": "タイマー",
     "u": "hitoiki-timer.html"
    },
    {
     "id": "hitoiki-yoga",
     "e": "🧘",
     "t": "ヨガ",
     "u": "hitoiki-yoga.html"
    },
    {
     "id": "hitoiki-kyoku",
     "e": "🎵",
     "t": "きょく",
     "u": "hitoiki-kyoku.html"
    },
    {
     "id": "hitoiki-settei",
     "e": "⚙️",
     "t": "せってい",
     "u": "hitoiki-settei.html"
    }
   ]
  }
 ]
};
// 版の 番号と 窓口の 場所(tools/build_lite.py の VER・REPO・FORM)
self.NUKUMADO = {"ver": "0.1", "repo": "https://github.com/RRYZ09/nukumado", "form": "https://docs.google.com/forms/d/e/1FAIpQLScUZ750yEgwpHjY8Gc3yJCdc3f2ihlHSSK8KFVOshjLfIRr0A/viewform", "formIds": {"kind": "entry.380046314", "app": "entry.98831620", "what": "entry.1736477838", "env": "entry.540362675"}, "formOpts": {"こまった": "困った (なにかがおかしい)", "こうして ほしい": "こうしてほしい (新しい機能など)", "はじめての しつもん": "はじめてのしつもん", "そのほか": "__other_option__"}, "fonts": true};
