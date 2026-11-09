import type { Copy } from './content';

type CoachNote = { detail: Copy; country?: Copy; achievements?: Copy; dates?: string };

const notes: Record<string, Copy> = {
  'Billy Lambe': [
    'Cầu thủ kiêm HLV trong giai đoạn đầu CLB thử nghiệm vai trò huấn luyện chuyên trách.',
    'An early player-coach as the club began to formalise coaching.',
  ],
  'Miles Barron': [
    'Barça mời HLV người Anh vào tháng 9 năm 1912.',
    'Barça hired the English coach in September 1912.',
  ],
  'Jack Alderson': [
    'Joan Gamper mời thủ môn trẻ về làm cầu thủ kiêm HLV.',
    'Joan Gamper recruited the young goalkeeper as a player-coach.',
  ],
  'Jack Greenwell': [
    'HLV người Anh dẫn dắt Barça qua hai giai đoạn riêng biệt.',
    'The English coach led the first team in two distinct spells.',
  ],
  'Jesza Poszony': [
    'Từng làm trợ lý cho Greenwell trước hai giai đoạn nắm đội một.',
    'Worked under Greenwell before two spells in charge of the first team.',
  ],
  'William Alfred Spouncer': [
    'Cựu cầu thủ Nottingham Forest được bổ nhiệm vào mùa thu 1923.',
    'The former Nottingham Forest player was appointed in autumn 1923.',
  ],
  'Ralph Kirby': [
    'Đến Barça vào giữa thập niên 1920 khi CLB vẫn thi đấu tại Les Corts.',
    'Joined Barça in the mid-1920s during the Les Corts era.',
  ],
  'Jack Domby': [
    'Trở lại băng ghế huấn luyện Barça vào mùa 1933–34.',
    'Returned to the Barça dugout for the 1933–34 season.',
  ],
  'Romà Forns': [
    'Cựu cầu thủ Barça góp phần dẫn dắt đội trong mùa La Liga đầu tiên.',
    'The former Barça player helped guide the club in the inaugural league season.',
  ],
  'James Bellamy': [
    'Cùng Romà Forns góp công vào chức vô địch La Liga đầu tiên của Barça.',
    'Shared coaching duties in the campaign that brought Barça its first league title.',
  ],
  'Franz Platko': [
    'Cựu thủ môn Barça tiếp quản đội từ Jack Domby và trở lại sau hai thập niên.',
    'The former Barça goalkeeper succeeded Jack Domby and returned two decades later.',
  ],
  "Patrick O'Connell": [
    'HLV người Ireland đến Barça sau khi giành chức vô địch quốc gia với Betis.',
    'The Irish coach came to Barça after winning the league with Betis.',
  ],
  'Josep Planas': [
    'Chuyển sang huấn luyện sau thời gian thi đấu cho Barça.',
    'Moved into coaching after his playing career at Barça.',
  ],
  'Ramón Guzmán': [
    'Dẫn dắt đội một trong một phần của mùa 1941–42.',
    'Managed the first team for part of the 1941–42 season.',
  ],
  'Joan Josep Nogués': [
    'Được giao dẫn dắt đội khi vẫn còn thi đấu.',
    'Took over as coach while he was still a player.',
  ],
  'Josep Samitier': [
    'Một trong những ngôi sao thời đầu của Barça, sau này trở lại dẫn dắt đội một.',
    'An early Barça star who returned to manage the first team.',
  ],
  'Enrique Fernández': [
    'Trở lại Barça làm HLV sau khi chấn thương kết thúc sự nghiệp cầu thủ.',
    'Returned as coach after an injury ended his playing career.',
  ],
  'Ramon Llorens': [
    'Gắn bó với Barça lâu năm và góp phần phát hiện Biosca, Manchón.',
    'A longtime Barça figure who helped identify talents such as Biosca and Manchón.',
  ],
  'Ferdinand Daucik': [
    'Gia nhập Barça cùng em vợ Ladislao Kubala.',
    'Arrived at Barça alongside his brother-in-law Ladislao Kubala.',
  ],
  'Sandro Puppo': [
    'Từng dẫn dắt đội tuyển Thổ Nhĩ Kỳ trước khi kế nhiệm Daučík.',
    'Coached Turkey before succeeding Daučík at Barça.',
  ],
  'Domènec Balmanya': [
    'Từng cùng Barça đoạt cúp quốc gia năm 1942 khi còn là cầu thủ.',
    'Won the Spanish cup with Barça as a player in 1942.',
  ],
  'Helenio Herrera': [
    'HLV có biệt danh El Mago, dẫn dắt đội trong ba nhiệm kỳ được CLB ghi nhận.',
    'Known as El Mago, he led Barça in three spells recorded by the club.',
  ],
  'Enric Rabassa': [
    'Tiếp quản đội sau khi làm trợ lý cho Helenio Herrera.',
    'Stepped up from Helenio Herrera’s coaching staff.',
  ],
  'Ljubisa Brocic': [
    'Được bổ nhiệm năm 1960 và rời Barça trước khi mùa giải kết thúc.',
    'Appointed in 1960 and departed before the season ended.',
  ],
  'Enrique Orizaola': [
    'Thay Brocic tháng 1 năm 1961 và nắm đội trong khoảng năm tháng.',
    'Succeeded Brocic in January 1961 and led the team for about five months.',
  ],
  'Lluís Miró': [
    'Tiếp quản đội từ Kubala trong nhiệm kỳ chủ tịch Enric Llaudet.',
    'Succeeded Kubala under president Enric Llaudet.',
  ],
  'Ladislao Kubala': [
    'Huyền thoại sân cỏ Barça sau này có hai giai đoạn làm HLV đội một.',
    'A Barça playing legend who later had two spells in charge.',
  ],
  'Josep Gonzalvo': [
    'Từng chơi ở tuyến giữa Barça cùng anh trai Marià Gonzalvo và Joan Sans.',
    'Played in Barça’s midfield alongside his brother Marià Gonzalvo and Joan Sans.',
  ],
  'César Rodríguez': [
    'Chân sút huyền thoại của Barça bắt đầu huấn luyện khi còn thi đấu cho Elche.',
    'The prolific Barça striker began coaching while still playing for Elche.',
  ],
  'Vicenç Sasot': [
    'Làm việc 14 năm ở đội trẻ Barça trước khi tiếp quản đội một.',
    'Spent 14 years in Barça’s youth setup before taking over the first team.',
  ],
  'Roque Olsen': [
    'Cựu cầu thủ Real Madrid chuyển sang huấn luyện sau chấn thương đầu gối.',
    'The former Real Madrid player turned to coaching after a knee injury.',
  ],
  'Salvador Artigas': [
    'Kế nhiệm Roque Olsen từ mùa 1967–68.',
    'Succeeded Roque Olsen for the 1967–68 season.',
  ],
  'Josep Seguer': [
    'Nắm đội một sau khi Artigas từ chức tháng 10 năm 1969.',
    'Took charge when Artigas resigned in October 1969.',
  ],
  'Vic Buckingham': [
    'Tiếp quản khi Barça đang ở giữa bảng xếp hạng vào đầu năm 1970.',
    'Took over in early 1970 with Barça in mid-table.',
  ],
  'Marinus Michels': [
    'HLV Hà Lan đến từ Ajax. Tên thường dùng là Rinus Michels.',
    'The Dutch coach joined from Ajax and was commonly known as Rinus Michels.',
  ],
  'Hennes Weisweiler': [
    'Đến Barça sau khi đoạt UEFA Cup với Borussia Mönchengladbach.',
    'Joined Barça after winning the UEFA Cup with Borussia Mönchengladbach.',
  ],
  'Laureano Ruiz': [
    'Được giao đội một sau khi Weisweiler rời CLB vào tháng 4 năm 1976.',
    'Took over after Weisweiler left in April 1976.',
  ],
  'Lucien Müller': [
    'Cựu cầu thủ Barça người Pháp trở lại CLB để làm HLV một thập niên sau.',
    'The former French Barça player returned as coach a decade after leaving.',
  ],
  'Joaquim Rifé': [
    'Cựu cầu thủ Barça thay Lucien Müller vào tháng 4 năm 1979.',
    'The former Barça player replaced Lucien Müller in April 1979.',
  ],
  'Udo Lattek': [
    'HLV người Đức đã thành công tại Bayern và Mönchengladbach trước khi tới Barça.',
    'The German coach had enjoyed success with Bayern and Mönchengladbach before joining Barça.',
  ],
  'José Luis Romero': [
    'Tạm quyền đúng một trận sau khi Udo Lattek rời ghế.',
    'Took charge for one match after Udo Lattek’s departure.',
  ],
  'César Luis Menotti': [
    'HLV người Argentina thay Udo Lattek vào tháng 3 năm 1983.',
    'The Argentine coach succeeded Udo Lattek in March 1983.',
  ],
  'Terry Venables': [
    'HLV người Anh kế nhiệm Menotti và giúp Barça vô địch La Liga 1984–85.',
    'The English coach succeeded Menotti and won the 1984–85 league title.',
  ],
  'Luis Aragonés': [
    'Dẫn dắt nhiều đội ở Tây Ban Nha, trong đó có Barça mùa 1987–88.',
    'Managed clubs across Spain, including Barça in 1987–88.',
  ],
  'Johan Cruyff': [
    'Trở lại Barça với vai trò HLV và xây dựng Dream Team.',
    'Returned as coach and assembled the Dream Team.',
  ],
  'Bobby Robson': [
    'Kế nhiệm Cruyff và giành Copa del Rey cùng Cúp C2 châu Âu.',
    'Succeeded Cruyff and won the Copa del Rey and the Cup Winners’ Cup.',
  ],
  'Louis van Gaal': [
    'HLV người Hà Lan đến từ Amsterdam và có hai nhiệm kỳ ở Barça.',
    'The Amsterdam-born Dutch coach held the Barça job twice.',
  ],
  'Llorenç Serra Ferrer': [
    'Nhà cầm quân người Mallorca tiếp quản đội vào mùa hè 2000.',
    'The Mallorcan coach took over in summer 2000.',
  ],
  'Carles Rexach': [
    'Cựu cầu thủ và HLV đội trẻ Barça, từng hỗ trợ Johan Cruyff ở đội một.',
    'A former Barça player and youth coach who assisted Johan Cruyff with the first team.',
  ],
  'Jesús Antonio de la Cruz': [
    'Cựu cầu thủ Barça dẫn dắt đúng một trận trước khi Radomir Antić tới.',
    'The former Barça player took charge for one match before Radomir Antić arrived.',
  ],
  'Radomir Antic': [
    'HLV người Serbia thay Louis van Gaal vào cuối tháng 1 năm 2003.',
    'The Serbian coach took over from Louis van Gaal in late January 2003.',
  ],
  'Frank Rijkaard': [
    'Kế nhiệm Antić năm 2003 và đưa Barça tới chức vô địch Champions League năm 2006.',
    'Succeeded Antić in 2003 and guided Barça to the 2006 Champions League title.',
  ],
  "Francesc 'Tito' Vilanova": [
    'Đội bóng đạt 100 điểm tại La Liga trong mùa duy nhất ông làm HLV trưởng.',
    'Barça reached 100 league points in his only season as head coach.',
  ],
  "Gerardo 'Tata' Martino": [
    'Tiếp quản đội một trong giai đoạn chuẩn bị cho mùa 2013–14 sau khi Vilanova rời ghế.',
    'Took charge during preparations for 2013–14 after Vilanova’s departure.',
  ],
  'Luis Enrique Martínez': [
    'Đến từ Celta Vigo và giành chín danh hiệu sau ba mùa tại Barça.',
    'Arrived from Celta Vigo and won nine trophies in three seasons.',
  ],
  'Ernesto Valverde': [
    'Trở lại CLB nơi ông từng thi đấu và đoạt bốn danh hiệu với tư cách HLV.',
    'Returned to his former club and won four trophies as head coach.',
  ],
  'Quique Setién': [
    'HLV người Cantabria, đến Barça sau thời gian tạo dấu ấn tại các CLB Tây Ban Nha.',
    'The Cantabrian coach arrived after making his name elsewhere in Spanish football.',
  ],
  'Ronald Koeman': [
    'Cựu cầu thủ Dream Team trở lại làm HLV và giành Copa del Rey mùa 2020–21.',
    'The former Dream Team player returned as coach and won the 2020–21 Copa del Rey.',
  ],
  'Xavi Hernández': [
    'Trở lại Barça làm HLV vào mùa thu 2021 và vô địch La Liga mùa 2022–23.',
    'Returned as coach in autumn 2021 and won the 2022–23 league title.',
  ],
};

const profiles: Record<string, CoachNote> = {
  'Josep Guardiola': {
    country: ['Tây Ban Nha', 'Spain'],
    detail: [
      'Sau khi dẫn dắt Barça B, Guardiola lên đội một và giành 14 danh hiệu trong bốn mùa.',
      'After coaching Barça B, Guardiola took over the first team and won 14 trophies across four seasons.',
    ],
    achievements: [
      'Cú ăn sáu năm 2009 và hai Champions League.',
      'The 2009 sextuple and two Champions League titles.',
    ],
  },
  'Hansi Flick': {
    country: ['Đức', 'Germany'],
    detail: [
      'Tiếp quản đội một vào mùa hè 2024. CLB công bố gia hạn hợp đồng đến 30/06/2028.',
      'Took over the first team in summer 2024. The club announced an extension through 30 June 2028.',
    ],
    achievements: [
      'Hai La Liga, hai Siêu cúp Tây Ban Nha và một Copa del Rey trong hai mùa đầu.',
      'Two league titles, two Spanish Super Cups and one Copa del Rey in his first two seasons.',
    ],
  },
  'Jordi Roura': {
    detail: [
      'Dẫn dắt đội một trong thời gian Tito Vilanova điều trị.',
      'Led the first team while Tito Vilanova received treatment.',
    ],
  },
  'Sergi Barjuan': {
    detail: [
      'Dẫn dắt đội một trong giai đoạn chuyển giao từ Ronald Koeman sang Xavi Hernández.',
      'Took charge of the first team between Ronald Koeman and Xavi Hernández.',
    ],
  },
};

export const coachNotes: Record<string, CoachNote> = {
  ...Object.fromEntries(Object.entries(notes).map(([name, detail]) => [name, { detail }])),
  ...profiles,
};
