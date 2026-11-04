// Original vector artwork. Each prop is an independently culled Phaser image.
const wrap = (
  w: number,
  h: number,
  body: string,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>
<linearGradient id="rock" x2=".8" y2="1"><stop stop-color="#b65435"/><stop offset=".35" stop-color="#74372e"/><stop offset=".7" stop-color="#412c32"/><stop offset="1" stop-color="#241e29"/></linearGradient>
<linearGradient id="edge" x2=".1" y2="1"><stop stop-color="#fcbe76"/><stop offset=".4" stop-color="#d76a32"/><stop offset="1" stop-color="#652823"/></linearGradient>
<linearGradient id="wood" x2="0" y2="1"><stop stop-color="#8e4a24"/><stop offset=".5" stop-color="#572a1e"/><stop offset="1" stop-color="#2b1b20"/></linearGradient>
<linearGradient id="gold" x2=".7" y2="1"><stop stop-color="#fff3be"/><stop offset=".4" stop-color="#ffc255"/><stop offset="1" stop-color="#a35b21"/></linearGradient>
<linearGradient id="red" x2=".7" y2="1"><stop stop-color="#ff5655"/><stop offset=".4" stop-color="#c51d35"/><stop offset="1" stop-color="#520f2d"/></linearGradient>
<radialGradient id="crystal"><stop stop-color="#fff4c2"/><stop offset=".3" stop-color="#ff8b6f"/><stop offset="1" stop-color="#bd1741"/></radialGradient>
<radialGradient id="dark"><stop stop-color="#361a39"/><stop offset="1" stop-color="#100f1f"/></radialGradient>
</defs>${body}</svg>`;
const text = (x: number, y: number, t: string, size = 30, color = '#fff3da') =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="${size}" fill="${color}">${t}</text>`;
const stone = wrap(
  340,
  320,
  `<ellipse cx="175" cy="294" rx="154" ry="22" fill="#100e1a" opacity=".55"/><path d="M12 265L30 128 82 50 164 12 249 48 318 160 330 270 240 308 96 298Z" fill="url(#rock)" stroke="#281c27" stroke-width="5"/><path d="M30 128l80 35L82 50l82-38 23 100 62-64-10 116 79-4-78 90 90 20-90 38-65-85-79 75 14-135-98 102Z" fill="#b45938" opacity=".3"/><path d="M34 126l48-76 82-38 23 100 62-64m-62 64-77 51 65 60 65 27 78-90M110 163L96 298" fill="none" stroke="#e4824e" stroke-opacity=".4" stroke-width="4"/><path d="M82 50l28 113-80-35m157-16-12 111 65 85" fill="none" stroke="#271c29" stroke-width="7"/><path d="M31 219l53-12m176-11 44-25M131 77l24-18" stroke="#efb47b" stroke-width="3" opacity=".3"/>`,
);
const crystal = wrap(
  190,
  230,
  `<ellipse cx="95" cy="209" rx="86" ry="18" fill="#ff3b3b" opacity=".17"/><path d="M50 200L18 102 42 67 77 143 90 16 115 2 145 92 127 192 160 108 178 141 164 204 98 221Z" fill="url(#crystal)" stroke="#ffbd96" stroke-width="3"/><path d="M90 16l16 119 9-133m-9 133 21 57 18-100M42 67l11 91-35-56m35 56 24-15m50 49 33-84 4 96" fill="none" stroke="#ffe6ba" stroke-width="2"/><path d="M50 200l3-42 45 63 8-86 21 57 37 12" fill="#ffcad1" opacity=".28"/><g fill="#ffe5be"><path d="M6 65h19m-9-9v18M157 49h22m-11-11v22" stroke="#ffe5be" stroke-width="2"/><circle cx="67" cy="37" r="3"/></g>`,
);
const banner = wrap(
  180,
  410,
  `<path d="M20 21L20 320 90 393 160 320V21Z" fill="#2a1824" stroke="#e7ac54" stroke-width="5"/><path d="M29 30v285l61 65 61-65V30Z" fill="url(#red)" stroke="#f1bb64" stroke-width="2"/><path d="M44 30v267l25 41V30m53 0v301l15-18V30" fill="#ef6353" opacity=".2"/><path d="M90 278V110m-37 45v44q37 29 74 0v-44M44 160l9-26 10 26m54 0 10-26 10 26m-57-45 10-31 10 31" stroke="url(#gold)" fill="none" stroke-width="9" stroke-linejoin="round"/><path d="M8 22h164" stroke="#ffe2a3" stroke-width="10"/><circle cx="8" cy="22" r="8" fill="#f7ba59"/><circle cx="172" cy="22" r="8" fill="#f7ba59"/>`,
);
const lantern = wrap(
  110,
  230,
  `<path d="M55 0v48m-5 0q-18-20 5-24 23 4 5 24" stroke="#553529" stroke-width="5" fill="none"/><path d="M17 83l38-31 38 31-12 13H29Z" fill="url(#gold)" stroke="#643d29" stroke-width="4"/><path d="M23 97l10 83 22 18 22-18 10-83Z" fill="#ffb836" stroke="#623a25" stroke-width="5"/><path d="M40 103l5 68 10 12 10-12 5-68" fill="#fff2ad"/><path d="M55 99v91m-29-85 58 0m-52 69h46" stroke="#a96927" stroke-width="4"/><path d="M31 184h48l-8 16H39Z" fill="url(#gold)"/><path d="M55 200v17" stroke="#9c672a" stroke-width="5"/>`,
);
const arch = (color: string) =>
  wrap(
    610,
    530,
    `<ellipse cx="305" cy="494" rx="275" ry="30" fill="${color}" opacity=".2"/><path d="M17 497L43 235 113 99 242 24 360 13 493 92 567 241 594 496Z" fill="url(#rock)" stroke="#321e2b" stroke-width="8"/><path d="M106 483V285C106 32 505 32 505 285V483Z" fill="url(#dark)" stroke="${color}" stroke-opacity=".15" stroke-width="40"/><path d="M106 483V285C106 32 505 32 505 285V483" fill="none" stroke="${color}" stroke-width="7"/><path d="M126 480V286C126 64 484 64 484 286V480" fill="none" stroke="${color}" stroke-opacity=".35" stroke-width="3"/><path d="M49 235l91 26-27-162 112 57 17-132 69 110 49-121 55 149 78-70-4 172 78-23M140 261l-34 120-66 44m375-263 74 102 16 114 76 43" fill="none" stroke="#e47845" stroke-opacity=".4" stroke-width="7"/><path d="M82 494h446l-20-23H104Zm-22 22h490l-22-22H82Z" fill="#8d6361" stroke="#d18a68" stroke-width="2"/><path d="M172 460l22-104m239 104-20-104m-106 104V237" stroke="${color}" stroke-opacity=".12" stroke-width="12"/>`,
  );
const sign = wrap(
  860,
  250,
  `<path d="M13 100L66 75 174 86 301 64 429 78 570 63 704 83 805 72 848 108 827 207 760 234 615 220 463 240 300 223 160 235 40 205Z" fill="#2c1520" stroke="#fb8c39" stroke-width="12"/><path d="M13 100L66 75 174 86 301 64 429 78 570 63 704 83 805 72 848 108 827 207 760 234 615 220 463 240 300 223 160 235 40 205Z" fill="url(#wood)" stroke="#ffd391" stroke-width="3"/><path d="M50 121l746-10M68 196l710 7M162 89l7 37m440 67-7 32" stroke="#c58046" stroke-width="3" opacity=".4"/>${text(430, 177, 'HANG QUỶ ĐỎ', 70)}<path d="M418 66V13m-20 12v20q20 17 40 0V25m-45 3 5-14 6 14m28 0 6-14 6 14m-32-14 6-14 6 14" fill="none" stroke="#ffd68a" stroke-width="6"/><g fill="#ffcf7c"><circle cx="64" cy="119" r="5"/><circle cx="797" cy="119" r="5"/><circle cx="68" cy="195" r="5"/><circle cx="785" cy="195" r="5"/></g>`,
);
const shop = wrap(
  680,
  550,
  `<ellipse cx="340" cy="514" rx="323" ry="30" fill="#100e1a" opacity=".55"/><path d="M66 229h551v268H66Z" fill="url(#wood)" stroke="#dc9b4e" stroke-width="5"/><path d="M91 246h501v158H91Z" fill="#281b26"/><g stroke="#a76b39" stroke-width="7"><path d="M93 309h497M93 376h497M182 246v158m145-158v158m145-158v158"/></g>${Array.from({ length: 18 }, (_, i) => `<path d="M${110 + (i % 6) * 80} ${270 + Math.floor(i / 6) * 57}v20h22v-20l-6-8h-10Z" fill="${['#dda63d', '#e66e3b', '#8ba890'][i % 3]}" stroke="#ffe2a1" stroke-width="2"/>`).join('')}<path d="M34 251L83 167h516l55 84Z" fill="#fff0d7" stroke="#b46d44" stroke-width="4"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${84 + i * 65} 167h33l27 84h-49Z" fill="url(#red)"/>`).join('')}<path d="M34 251h620v26q-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0-20 24-40 0Z" fill="#e54347"/><path d="M86 414h508v84H86Z" fill="url(#wood)" stroke="#f0b15e" stroke-width="7"/><path d="M110 433h464m-464 49h464" stroke="#a45a32" stroke-width="3"/><path d="M70 126L110 60l457-20 63 74-37 55-482 13Z" fill="url(#wood)" stroke="#ffbd59" stroke-width="7"/>${text(347, 130, 'QUẦY CÀ KHỊA', 46)}<path d="M124 301v-30m93 30v-30m95 30v-30m95 30v-30m95 30v-30" stroke="#ffcf78" stroke-width="8"/><g fill="#ffe3a1"><circle cx="124" cy="299" r="5"/><circle cx="217" cy="299" r="5"/><circle cx="312" cy="299" r="5"/><circle cx="407" cy="299" r="5"/><circle cx="502" cy="299" r="5"/></g>${text(340, 463, 'CÀ KHỊA VUI · VĂN MINH', 20)}`,
);
const screen = wrap(
  720,
  440,
  `<ellipse cx="360" cy="416" rx="340" ry="20" fill="#100d19" opacity=".5"/><path d="M66 400V108m588 292V108" stroke="#72452e" stroke-width="22"/><rect x="21" y="48" width="678" height="327" rx="22" fill="#1a1725" stroke="url(#gold)" stroke-width="8"/><rect x="44" y="75" width="632" height="274" rx="6" fill="#345951"/><path d="M52 100h616M52 155h616M52 210h616M52 265h616M52 320h616" stroke="#3f6d5a" stroke-width="27"/><path d="M74 96h572v235H74Zm286 0v235" fill="none" stroke="#dce7bb" stroke-width="3"/><ellipse cx="360" cy="214" rx="54" ry="47" fill="none" stroke="#dce7bb" stroke-width="3"/><path d="M74 157h83v114H74m572-114h-83v114h83" fill="none" stroke="#dce7bb" stroke-width="3"/>${[
    [170, 230],
    [270, 150],
    [398, 257],
    [510, 168],
    [577, 259],
  ]
    .map(
      ([x, y], i) =>
        `<circle cx="${x}" cy="${y - 8}" r="8" fill="#f3c5a0"/><path d="M${x - 8} ${y}h16v21h-16Z" fill="${i % 2 ? '#74ceef' : '#f14648'}"/>`,
    )
    .join(
      '',
    )}<circle cx="403" cy="283" r="6" fill="#ffefd3"/><rect x="150" y="20" width="420" height="51" rx="9" fill="url(#wood)" stroke="#f6b45b" stroke-width="3"/>${text(360, 55, 'KHU XEM BÓNG', 32)}<rect x="221" y="84" width="276" height="30" rx="4" fill="#141b2a"/>${text(360, 106, 'ĐỎ  0 : 3  XANH  ·  DEMO', 17)}${text(360, 397, 'SÂN BÓNG MINH HỌA · KHÔNG PHÁT SÓNG', 16, '#ecc69a')}`,
);
const seat = wrap(
  110,
  125,
  `<ellipse cx="55" cy="115" rx="47" ry="9" fill="#160d1c" opacity=".5"/><path d="M24 76v38m63-38v38" stroke="#b17c47" stroke-width="7"/><rect x="18" y="15" width="77" height="73" rx="14" fill="url(#red)" stroke="#ffa276" stroke-width="4"/><rect x="22" y="74" width="69" height="24" rx="7" fill="#d63b48" stroke="#fc9b70" stroke-width="3"/><path d="M11 65v30m89-30v30" stroke="#dcaf64" stroke-width="8"/><path d="M30 26h51" stroke="#fa7c6b" stroke-width="3"/>`,
);
export const caveAssets: Record<string, string> = {
  'red-rock': stone,
  'red-crystal': crystal,
  'red-banner': banner,
  'cave-lantern': lantern,
  'cave-sign': sign,
  'troll-shop': shop,
  'football-screen': screen,
  'cave-seat': seat,
  'red-arch': arch('#ff654b'),
  'fun-arch': arch('#c479ff'),
  'event-arch': arch('#4dc9ff'),
};
caveAssets.ball = wrap(
  300,
  330,
  `<ellipse cx="150" cy="303" rx="142" ry="24" fill="#171122" opacity=".6"/><path d="M21 278v-40h258v40q-129 42-258 0Z" fill="url(#rock)" stroke="#e9ac58" stroke-width="4"/><ellipse cx="150" cy="237" rx="129" ry="31" fill="url(#gold)"/><path d="M116 224l12-52h44l12 52" fill="url(#gold)"/><circle cx="150" cy="104" r="86" fill="url(#gold)" stroke="#fff1b9" stroke-width="4"/><path d="M129 76l42-3 22 35-30 34-40-13-12-33Z" fill="#b27228" stroke="#fff0b5" stroke-width="3"/><path d="M129 76l-13-49m55 46 34-36m-12 71 40 12m-70 22 3 47m-43-60-43 19M116 27L84 51 65 94l15 54 37 34 49 7 43-21 24-48-7-46-21-37Z" fill="none" stroke="#fff1bd" stroke-width="4"/><path d="M87 68q18-29 52-29" fill="none" stroke="#fffbe1" stroke-width="9" stroke-linecap="round"/>`,
);
caveAssets.board = wrap(
  250,
  250,
  `<path d="M26 248V65m196 183V65" stroke="#a46c3d" stroke-width="14"/><rect x="8" y="25" width="234" height="184" rx="12" fill="url(#wood)" stroke="#e6aa5e" stroke-width="5"/>${text(125, 65, 'HÔM NAY TRONG HANG', 16)}<path d="M23 81h204" stroke="#cb9257"/>${text(125, 113, '✦ GẶP HỘI TRƯỚC TRẬN', 14)}${text(125, 148, '✦ THỬ HIỆU ỨNG DEMO', 14)}${text(125, 183, '✦ CHỤP ẢNH CÙNG NHAU', 14)}`,
);
