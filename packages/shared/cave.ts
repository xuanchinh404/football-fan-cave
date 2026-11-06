// Shared by Phaser and the authoritative room server. Coordinates are feet positions.
export const RED_CAVE = {
  width: 4096,
  height: 3072,
  spawn: { x: 2048, y: 2180 },
  bounds: { l: 480, r: 3640, t: 300, b: 2870 },
  zones: [
    { id: 'hall', label: 'Sảnh trú ẩn', x: 2048, y: 1900, color: '#ffb84d', icon: '♟' },
    { id: 'lounge', label: 'Góc Tâm Sự Fan', x: 920, y: 1550, color: '#ff794e', icon: '▣' },
    { id: 'shop', label: 'Quầy Cà Khịa', x: 3190, y: 1810, color: '#ffc454', icon: '◖' },
    { id: 'fun', label: 'Khu giải trí', x: 1040, y: 720, color: '#d78bff', icon: '✧' },
    { id: 'event', label: 'Khu sự kiện', x: 3100, y: 710, color: '#68ceff', icon: '★' },
    {
      id: 'museum',
      label: 'Lối vào Phòng Hoài Niệm',
      x: 2048,
      y: 1360,
      color: '#ffe19a',
      icon: '♜',
    },
    { id: 'exit', label: 'Cổng Ra Hang', x: 2048, y: 2750, color: '#e8d6a8', icon: '↗' },
  ],
  obstacles: [
    { x: 1868, y: 1580, w: 360, h: 155 }, // golden ball plinth
    { x: 2920, y: 1490, w: 500, h: 230 }, // shop counter
    { x: 590, y: 1050, w: 620, h: 220 }, // screen and stand
    { x: 1450, y: 1820, w: 230, h: 100 }, // activity board
    { x: 1740, y: 600, w: 610, h: 400 }, // rear cave spine
    { x: 490, y: 1900, w: 510, h: 260 },
    { x: 3340, y: 2050, w: 300, h: 300 },
    { x: 1210, y: 560, w: 210, h: 430 },
    { x: 2660, y: 500, w: 190, h: 440 },
    { x: 620, y: 310, w: 430, h: 130 }, // photo booth back wall
    { x: 3000, y: 310, w: 460, h: 140 }, // event stage back wall
    { x: 730, y: 1500, w: 200, h: 70 }, // lounge coffee table
    { x: 600, y: 1380, w: 500, h: 35 }, // sofa back; seat interaction stays walkable
    { x: 600, y: 1670, w: 500, h: 35 },
    { x: 1840, y: 1070, w: 60, h: 370 }, // separate museum passage, opaque walls
    { x: 2200, y: 1070, w: 60, h: 370 },
    { x: 1270, y: 2250, w: 65, h: 65 }, // entry columns
    { x: 2760, y: 2250, w: 65, h: 65 },
    { x: 656, y: 1836, w: 48, h: 80 }, // lounge arch posts
    { x: 1184, y: 1836, w: 48, h: 80 },
    { x: 1840, y: 2710, w: 48, h: 80 }, // exit arch posts
    { x: 2208, y: 2710, w: 48, h: 80 },
  ],
  seats: [
    { x: 680, y: 1450 },
    { x: 840, y: 1450 },
    { x: 1000, y: 1450 },
    { x: 680, y: 1630 },
    { x: 840, y: 1630 },
    { x: 1000, y: 1630 },
  ],
  npcs: [
    [1830, 1920],
    [2290, 1890],
    [1880, 2080],
    [2310, 2160],
    [2600, 1830],
    [1300, 1580],
    [1100, 1760],
    [2780, 1720],
    [3070, 1860],
    [3330, 1800],
    [1600, 1300],
    [2450, 1300],
    [1000, 830],
    [3050, 820],
    [830, 530],
    [3240, 560],
  ],
} as const;
export const CAVE_EVENTS = [
  {
    title: 'Hội ngộ trước giờ bóng lăn',
    detail:
      'Gặp nhau tại sân khấu xanh, chia sẻ dự đoán và chọn biểu cảm. Hoạt động cộng đồng tự do, không có giải thưởng.',
  },
  {
    title: 'Khoảnh khắc trong hang',
    detail: 'Ghé cổng tím, tạo dáng tại góc chụp ảnh và lưu kỷ niệm cùng hội.',
  },
];
