/** Stylized busts, not photographic likenesses. Dates describe the United playing career. */
export const legends = [
  {
    name: 'Eric Cantona',
    years: '1992–1997',
    number: 7,
    bio: 'Thủ lĩnh sáng tạo của thế hệ đầu Premier League; 4 chức vô địch quốc gia cùng United.',
  },
  {
    name: 'Ryan Giggs',
    years: '1991–2014',
    number: 11,
    bio: '963 lần ra sân cho United và 13 chức vô địch Premier League.',
  },
  {
    name: 'Paul Scholes',
    years: '1994–2013',
    number: 18,
    bio: 'Bộ óc tuyến giữa, thành viên Class of 92 và đội hình ăn ba 1999.',
  },
  {
    name: 'Wayne Rooney',
    years: '2004–2017',
    number: 10,
    bio: '253 bàn thắng: chân sút ghi nhiều bàn nhất lịch sử Manchester United.',
  },
  {
    name: 'Cristiano Ronaldo',
    years: '2003–2009 · 2021–2022',
    number: 7,
    bio: 'Quả bóng vàng 2008; vô địch Champions League cùng United tại Moscow.',
  },
  {
    name: 'Sir Bobby Charlton',
    years: '1956–1973',
    number: 9,
    bio: 'Sống sót sau Munich; cùng Sir Matt Busby đăng quang châu Âu năm 1968.',
  },
  {
    name: 'George Best',
    years: '1963–1974',
    number: 7,
    bio: 'Thiên tài chạy cánh, Quả bóng vàng 1968 và một phần của United Trinity.',
  },
  {
    name: 'Roy Keane',
    years: '1993–2005',
    number: 16,
    bio: 'Đội trưởng của cú ăn ba; biểu tượng tinh thần chiến đấu ở tuyến giữa.',
  },
  {
    name: 'Nemanja Vidić',
    years: '2006–2014',
    number: 15,
    bio: 'Trung vệ thép, 5 Premier League và Champions League 2008.',
  },
  {
    name: 'Rio Ferdinand',
    years: '2002–2014',
    number: 5,
    bio: 'Trung vệ của 6 chức vô địch Premier League; cùng Vidić tạo nên cặp phòng ngự huyền thoại.',
  },
  {
    name: 'Edwin van der Sar',
    years: '2005–2011',
    number: 1,
    bio: 'Thủ môn cản quả luân lưu quyết định tại chung kết Champions League 2008.',
  },
].map((l, i) => ({
  ...l,
  id: `legend-${i}`,
  x: 1980 + i * 135,
  y: 3770,
  source: 'https://www.manutd.com/en/players-and-staff/legends',
}));
