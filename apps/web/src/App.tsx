import { CITY_COPY, cityInteractionLabel, cityLanguage, cityText, type CitySection } from '../../../packages/shared/city/content';
import { CITY_SEAT_DIRECTION, cityArea } from '../../../packages/shared/city/layout';
import { CityCollection, CityHUD, CityMatchBoard } from './ui/CityHUD';
import { clearPath } from '../../../packages/shared/world';
import {
  LIVERPOOL_VERIFIED_AT,
  liverpoolDemo,
  liverpoolExhibits,
} from '../../../packages/shared/liverpool/content';
import { KOP_CAVE, KOP_MUSEUM, kopSeatFacing } from '../../../packages/shared/liverpool/layout';
import { LiverpoolHUD } from './ui/LiverpoolHUD';
import { ArsenalHUD } from './ui/ArsenalHUD';
import { MuseumExhibitPanel } from './ui/MuseumExhibitPanel';
import {
  arsenalDemo,
  arsenalExhibits,
  ARSENAL_VERIFIED_AT,
} from '../../../packages/shared/arsenal/content';
import { ARSENAL_CAVE, ARSENAL_MUSEUM } from '../../../packages/shared/arsenal/layout';
import './ui/arsenal-3d.css';
import { ChelseaHUD, ChelseaExhibitPanel } from './ui/ChelseaHUD';
import { chelseaExhibits, chelseaMatchState } from '../../../packages/shared/chelsea/content';
import { BLUES_CAVE, BLUES_MUSEUM } from '../../../packages/shared/chelsea/layout';
import './ui/chelsea-3d.css';
import { isCaveZone, isRefuge } from '../../../packages/shared/caveConnections';
import { CAVES, GRAND_PLACES } from '../../../packages/shared/grandHall';
import { GrandHUD, GrandPanel } from './ui/GrandHUD';
import { HALL } from '../../../packages/shared/museum';
import { hallLanguage, hallStations, hallText } from '../../../packages/shared/museum/hall';
import { RedDevilsExhibitPanel } from './ui/RedDevilsExhibitPanel';
import { MuseumHUD } from './ui/MuseumHUD';
import './ui/museum.css';
import { CAVE_EVENTS, RED_CAVE } from '../../../packages/shared/cave';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Map,
  House,
  Users,
  Volume2,
  Heart,
  HelpCircle,
  ChevronDown,
  MessageCircle,
  Smile,
  Camera,
  Send,
  X,
  Maximize,
  Compass,
  Radio,
  Footprints,
  Flag,
  EyeOff,
  ChevronRight,
  Copy,
  Check,
  Settings2,
  Flame,
  LogOut,
  Wifi,
  WifiOff,
  Sparkles,
  Megaphone,
  Tent,
  MoveUpRight,
} from 'lucide-react';
import {
  EMOJIS,
  STICKERS,
  TEAMS,
  SPAWN,
  arrival,
  isOpenCave,
  validProfile,
  type ChatMessage,
  type Player,
  type Profile,
} from '../../../packages/shared/world';
import { GameCanvas } from './game/GameCanvas';
import { readCameraSettings, saveCameraSettings } from './game/three/cameraSettings';
import { playtestInteractions, playtestNear as near } from './game/three/worldLayout';
import { emit, on, type WorldState } from './game/bridge';
import { socket } from './network/client';
import { Minimap } from './ui/Minimap';
import { Joystick } from './ui/Joystick';
import './styles.css';
import './ui/fantasy-hud.css';
import './ui/grand-hud.css';
import './ui/red-cave-3d.css';
import { ActionBar } from './ui/ActionBar';
import { AdvanceControl } from './ui/AdvanceControl';
import { WorldSignposts } from './ui/WorldSignposts';
type Modal =
  | 'city-collection'
  | 'exhibit'
  | 'quiz'
  | 'join'
  | 'map'
  | 'help'
  | 'shop'
  | 'support'
  | 'score'
  | 'event'
  | 'settings'
  | 'statue'
  | 'board'
  | 'prediction'
  | 'minigame'
  | 'ranking'
  | 'wallet'
  | null;
const initial: WorldState = { map: 'plaza', position: SPAWN, fps: 60 };
export default function App({
  accountProfile,
  isGuest = false,
}: {
  accountProfile: Profile;
  isGuest?: boolean;
}) {
  const [world, setWorld] = useState(initial),
    [ready, setReady] = useState(false),
    [profile, setProfile] = useState<Profile>(accountProfile),
    [playing, setPlaying] = useState(false),
    [modal, setModal] = useState<Modal>(null),
    [welcome, setWelcome] = useState(true),
    [online, setOnline] = useState(false),
    [count, setCount] = useState(0),
    [messages, setMessages] = useState<ChatMessage[]>([]),
    [chatVisible, setChatVisible] = useState(window.innerWidth > 640),
    [chatTab, setChatTab] = useState('room'),
    [roomCount, setRoomCount] = useState(0),
    [reduced, setReduced] = useState(window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    [text, setText] = useState(''),
    [emojiOpen, setEmojiOpen] = useState(false),
    [toast, setToast] = useState(''),
    [selected, setSelected] = useState<ChatMessage | null>(null),
    [blocked, setBlocked] = useState<Set<string>>(new Set()),
    [config, setConfig] = useState<{ supportUrl?: string; supportText?: string; sponsor?: string }>(
      {},
    ),
    [copied, setCopied] = useState(false);
  const [exhibitId, setExhibitId] = useState('');
  const [citySection, setCitySection] = useState<CitySection>('overview');
  const [cityNews, setCityNews] = useState(false);
  const [cameraSettings, setCameraSettings] = useState(readCameraSettings);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const kopExhibit = liverpoolExhibits.find((e) => e.id === exhibitId);
  const gunnersExhibit = arsenalExhibits.find((e) => e.id === exhibitId);
  const bluesExhibit = chelseaExhibits.find((e) => e.id === exhibitId);
  const input = useRef<HTMLInputElement>(null),
    chatEnd = useRef<HTMLDivElement>(null),
    profileRef = useRef<Profile | null>(null),
    worldRef = useRef(world),
    modalRef = useRef(modal),
    lastChat = useRef(0),
    lastPreview = useRef(0),
    toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    self = useRef('demo');
  worldRef.current = world;
  modalRef.current = modal;
  function notice(value: string) {
    setToast(value);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }
  useEffect(() => {
    const off = [
      on<WorldState>('state', setWorld),
      on('stand', () => {
        if (socket.connected) socket.emit('stand');
      }),
      on('ready', () => setReady(true)),
      on<string>('notice', notice),
      on<Pick<WorldState, 'map' | 'position' | 'seated'>>('interact', (state) => interactAt(state)),
      on('toggle-emotes', () => setEmojiOpen((v) => !v)),
      on('open-banter', () => setModal('shop')),
      on<string>('inspect', (id) => {
        const w = worldRef.current,
          item = playtestInteractions(w.map).find((p) => p.kind === 'exhibit' && p.id === id);
        if (!item || modalRef.current) return;
        if (
          Math.hypot(item.x - w.position.x, item.y - w.position.y) > (item.inspectRadius ?? 125)
        ) {
          const english = hallLanguage(document.documentElement.lang) === 'en';
          notice(w.map === 'hall-of-legends'
            ? (english ? 'Move closer and press F or tap the exhibit.' : 'Đến gần hiện vật rồi nhấn F hoặc chạm vào để đọc.')
            : 'Đến gần hiện vật rồi nhấn E hoặc bấm vào để đọc.');
          return;
        }
        setExhibitId(id);
        setModal('exhibit');
      }),
      on<string>('city-exhibit', (id) => {
        if (worldRef.current.map !== 'city' || cityArea(worldRef.current.position) !== 'museum') return;
        setExhibitId(id);
        setModal('exhibit');
      }),
      on<boolean>('city-board', (news) => {
        if (worldRef.current.map !== 'city') return;
        const area = cityArea(worldRef.current.position);
        if (area !== 'hall' && area !== 'lounge') return;
        setCityNews(news);
        setModal('score');
      }),
      on('focus-chat', () => {
        setChatVisible(true);
        setTimeout(() => input.current?.focus(), 50);
      }),
      on<any>('movement', (p) => {
        if (socket.connected) socket.emit('move', p);
      }),
    ];
    const connect = () => {
      setOnline(true);
      emit('connected', true);
      if (profileRef.current) socket.emit('join', profileRef.current);
    };
    const disconnect = () => {
      setOnline(false);
      self.current = 'demo';
      emit('connected', false);
      emit('remotes', { players: [], self: 'demo' });
      notice('Kết nối bị gián đoạn. Bạn vẫn có thể khám phá 3D; đang thử kết nối lại.');
    };
    const joined = ({ player, room }: { player: Player; room: string }) => {
      self.current = player.id;
      setProfile({ nickname: player.nickname, team: player.team, avatar: player.avatar });
      emit('start', { profile: player, id: player.id });
      emit('travel', { map: player.map, x: player.x, y: player.y });
      notice(`Đã vào phòng ${room}. Dữ liệu phiên chơi được lưu tạm thời.`);
    };
    const snapshot = (players: Player[]) => emit('remotes', { players, self: socket.id });
    const chat = (m: ChatMessage) => {
      setMessages((v) => [...v.slice(-79), m]);
      emit('bubble', { id: m.playerId, text: m.text });
    };
    const emoji = ({ id, value }: { id: string; value: string }) => {
      emit('bubble', { id, text: value });
      if (id !== self.current) emit('avatar-emote', { id, value });
    };
    socket
      .on('connect_error', (e) => notice(e.message))
      .on('connect', connect)
      .on('disconnect', disconnect)
      .on('joined', joined)
      .on('snapshot', snapshot)
      .on('online', setCount)
      .on('room-count', (data) => setRoomCount(data.count))
      .on('seated', (data) => {
        emit('correct', data);
        emit('seated', data);
      })
      .on('relocate', (data) => emit('travel', data))
      .on('gate:state', (data) => emit('gate-state', data))
      .on('chat', chat)
      .on('emoji', emoji)
      .on('notice', notice)
      .on('correct', (p) => emit('correct', p));
    fetch('/api/config')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
    return () => {
      off.forEach((f) => f());
      for (const event of [
        'connect',
        'connect_error',
        'disconnect',
        'joined',
        'snapshot',
        'online',
        'room-count',
        'seated',
        'relocate',
        'gate:state',
        'chat',
        'emoji',
        'notice',
        'correct',
      ])
        socket.removeAllListeners(event);
      socket.disconnect();
      clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    emit('reduced-effects', reduced);
  }, [reduced, ready]);
  useEffect(() => {
    saveCameraSettings(cameraSettings);
    emit('camera-settings', cameraSettings);
  }, [cameraSettings, ready]);
  useEffect(() => {
    emit('block', !!modal);
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [modal]);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);
  function interact() {
    interactAt(worldRef.current);
  }
  function interactAt(w: Pick<WorldState, 'map' | 'position' | 'seated'>) {
    const p = near(w.map, w.position);
    if (!p) return;
    if (w.map === 'city' && p.kind === 'score') {
      setCityNews(p.id === 'city-news');
      setModal('score');
      return;
    }
    if (p.kind === 'exhibit') {
      setExhibitId(p.id);
      setModal('exhibit');
      return;
    }
    if (p.kind === 'wallet' || (w.map === 'plaza' && p.kind === 'shop')) {
      openWallet();
      return;
    }
    if (p.id === 'prediction') {
      setModal('prediction');
      return;
    }
    if (p.kind === 'portal') {
      if (w.map === 'plaza' && !isOpenCave(p.target)) {
        notice('Nội thất ' + p.label + ' sắp ra mắt. Bạn vẫn có thể khám phá sân trước cổng.');
        return;
      }
      if (socket.connected) {
        socket.emit('travel', p.target);
      } else {
        emit('travel', {
          map: p.target,
          ...arrival(w.map, p.target!),
        });
        notice(
          `Đã đến ${p.target === 'liverpool-museum' ? 'Phòng Truyền Thống Liverpool' : p.target === 'arsenal-museum' ? 'Phòng Truyền Thống Arsenal' : p.target === 'chelsea-museum' ? 'Phòng Truyền Thống Chelsea' : p.target === 'hall-of-legends' ? hallText[hallLanguage(document.documentElement.lang)].area : p.target === 'plaza' ? 'quảng trường' : TEAMS.find((t) => t.id === p.target)?.name}.`,
        );
      }
    } else if (p.kind === 'seat') {
      if (w.map === 'liverpool' || w.map === 'city') {
        if (socket.connected) socket.emit('interact', p.id);
        else {
          if (!w.seated && !clearPath(w.map, w.position, p)) return;
          if (!w.seated) emit('correct', p);
          emit('seated', { seated: !w.seated, direction: w.map === 'city' ? CITY_SEAT_DIRECTION : kopSeatFacing(p) });
        }
        if (w.map === 'liverpool') notice('Nhấn E hoặc di chuyển để đứng dậy.');
        return;
      }
      emit('sit', !w.seated);
      if (socket.connected) socket.emit('interact', p.id);
      else emit('toggle-seat');
      notice('Nhấn E hoặc di chuyển để đứng dậy.');
    } else if (p.kind === 'passage' && p.destination) {
      if (socket.connected) socket.emit('interact', p.id);
      else emit('travel', { map: w.map, ...p.destination });
    } else if (p.kind === 'photo') {
      emit('bubble', { id: self.current, text: '📸 ✨' });
      emit('photo-mode', true);
    } else if (p.kind !== 'passage') setModal(p.kind);
  }
  function openWallet() {
    const launcher = document.querySelector<HTMLButtonElement>('.account-launcher');
    if (launcher) launcher.click();
    else setModal('wallet');
  }
  function start() {
    if (profile.nickname.trim().length < 2) {
      notice('Tên nhân vật cần ít nhất 2 ký tự.');
      return;
    }
    const p = { ...profile, nickname: profile.nickname.trim().slice(0, 20) };
    setProfile(p);
    profileRef.current = p;
    setPlaying(true);
    setWelcome(false);
    setModal(null);
    localStorage.setItem('hang-profile', JSON.stringify(p));
    emit('start', { profile: p, id: 'demo' });
    if (socket.connected) socket.emit('join', p);
    else if ((socket.auth as { accessToken?: string } | undefined)?.accessToken) socket.connect();
    setMessages([
      {
        id: 'welcome',
        playerId: 'system',
        nickname: 'Người giữ hang',
        team: 'common',
        text: `Chào ${p.nickname}! Đi tới cổng đội bạn yêu thích, cửa sẽ tự mở khi bạn đến gần.`,
        time: Date.now(),
        system: true,
      },
    ]);
  }
  useEffect(() => {
    if (ready && !profileRef.current) start();
  }, [ready]);
  function send(value = text) {
    if (!playing) {
      setModal('join');
      return;
    }
    if (!value.trim()) return;
    if (Date.now() - lastChat.current < 1300) {
      notice('Đợi một chút rồi gửi tiếp nhé.');
      return;
    }
    lastChat.current = Date.now();
    const cleaned = value.trim().slice(0, 180);
    if (socket.connected) socket.emit('chat', { text: cleaned, channel: chatTab });
    else {
      const m: ChatMessage = {
        id: crypto.randomUUID(),
        playerId: 'demo',
        nickname: profile.nickname,
        team: profile.team,
        text: cleaned,
        map: world.map,
        channel: chatTab as 'room' | 'nearby',
        time: Date.now(),
      };
      setMessages((v) => [...v.slice(-79), m]);
      emit('bubble', { id: 'demo', text: cleaned });
    }
    setText('');
    setEmojiOpen(false);
  }
  function emoji(value: string) {
    emit('avatar-emote', { id: self.current, value });
    if (!playing) {
      setModal('join');
      return;
    }
    if (socket.connected) socket.emit('emoji', value);
    else emit('bubble', { id: 'demo', text: value });
    setEmojiOpen(false);
  }
  function preview(kind: string) {
    if (!playing) {
      setModal('join');
      return;
    }
    if (Date.now() - lastPreview.current < 4000) {
      notice('Đợi 4 giây giữa các lần xem thử hiệu ứng.');
      return;
    }
    lastPreview.current = Date.now();
    setModal(null);
    emit('effect', kind);
    notice('Hiệu ứng xem thử trên thiết bị của bạn · Không phát sinh thanh toán.');
  }
  async function invite() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notice('Đã sao chép liên kết. Bạn bè cần truy cập cùng máy chủ để gặp nhau.');
    } catch {
      notice(`Đường dẫn mời bạn: ${window.location.origin}`);
    }
  }
  const cityRoom = world.map === 'city';
  const cityLang = cityLanguage(document.documentElement.lang);
  const cityZone = cityArea(world.position);
  const liverpoolRoom = world.map === 'liverpool' || world.map === 'liverpool-museum';
  const museumLanguage = hallLanguage(document.documentElement.lang);
  const muMuseum = world.map === 'hall-of-legends';
  const muLabels = hallText[museumLanguage];
  const muStation = muMuseum ? hallStations.find((item) => item.id === world.near?.id) : undefined;
  const arsenalRoom = world.map === 'arsenal' || world.map === 'arsenal-museum';
  const demoMatch =
    world.map === 'liverpool'
      ? liverpoolDemo
      : world.map === 'arsenal'
        ? arsenalDemo
        : world.map === 'chelsea'
          ? chelseaMatchState
          : undefined;
  const team = TEAMS.find((t) => t.id === profile.team)!,
    area =
      cityRoom
        ? cityZone === 'hall' ? cityText(cityLang, CITY_COPY.hall)
          : cityText(cityLang, CITY_COPY[cityZone])
        : world.map === 'liverpool-museum'
        ? 'Phòng Truyền Thống Liverpool'
        : world.map === 'arsenal-museum'
          ? 'Phòng Truyền Thống Arsenal'
          : world.map === 'chelsea-museum'
            ? 'Phòng Truyền Thống Chelsea'
            : world.map === 'hall-of-legends'
              ? muLabels.area
              : world.map === 'plaza'
                ? 'Đại Sảnh Chung'
                : CAVES.find((c) => c.id === world.map)?.name ?? TEAMS.find((t) => t.id === world.map)?.name;
  return (
    <div
      className={`app-shell ${cityRoom ? 'city-shell' : ''} ${arsenalRoom || liverpoolRoom ? 'red-cave gunners-cave' : ''} ${world.map === 'chelsea' || world.map === 'chelsea-museum' ? 'red-cave blues-cave' : ''} ${world.map === 'united' || world.map === 'hall-of-legends' ? 'red-cave' : ''} ${world.map === 'hall-of-legends' || world.map === 'chelsea-museum' || world.map === 'arsenal-museum' || world.map === 'liverpool-museum' ? 'museum-shell' : ''}`}
    >
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setWelcome((v) => !v);
          }}
        >
          <span className="brand-mark">
            <Flame size={39} strokeWidth={2.2} />
          </span>
          <div>
            HỘI VÀO HANG<span>THẾ GIỚI CỦA FAN BÓNG ĐÁ</span>
          </div>
          <b>BETA</b>
        </a>
        <nav>
          <button
            className="nav-active"
            onClick={() => {
              if (world.map === 'plaza')
                notice('Bạn đang ở quảng trường. Di chuyển để khám phá thế giới!');
              else if (isCaveZone(world.map))
                notice('Theo đường hầm và đi thẳng qua cửa để về Đại Sảnh Chung.');
              else notice('Đến lối ra phía nam hang và nhấn E để về quảng trường.');
            }}
          >
            <House size={17} /> <span>Trang chủ</span>
          </button>
          <button onClick={() => setModal('map')}>
            <Map size={17} />
            <span>Bản đồ</span>
          </button>
          <button onClick={() => notice('Bang hội chưa phát hành.')}>Bang hội</button>
          <button onClick={() => setModal('event')}>Sự kiện</button>
          <div className="online-pill">
            <i className={online ? 'live' : ''} />
            <Users size={21} />
            <span>
              {online ? (
                <>
                  <small>Đang online:</small> <strong>{count}</strong>
                  <em>đang online</em>
                </>
              ) : (
                'Chế độ khám phá'
              )}
            </span>
          </div>
        </nav>
        <div className="header-actions">
          <button className="shop-nav" onClick={() => setModal('shop')}>
            <Megaphone size={17} />
            <span>Quầy Cà Khịa</span>
            <i>MỚI</i>
          </button>
          <button
            className="icon-button help-btn"
            onClick={() => setModal('help')}
            aria-label="Hướng dẫn"
          >
            <HelpCircle size={23} />
            <span>Hướng dẫn</span>
          </button>
          <button className="support-btn" onClick={() => setModal('support')}>
            <Heart size={16} />
            <span>Ủng hộ dự án</span>
          </button>
        </div>
      </header>
      <main className="playfield">
        <GameCanvas />
        {playing && (
          <GrandHUD
            profile={profile}
            world={world}
            openWallet={openWallet}
            settings={() => setModal('settings')}
            notice={notice}
          />
        )}
        {playing && cityRoom && <CityHUD lang={cityLang} area={cityZone} open={(section) => {
          setCitySection(section);
          setModal('city-collection');
        }} />}
        {liverpoolRoom && <LiverpoolHUD world={world} openMap={() => setModal('map')} />}
        {arsenalRoom && (
          <ArsenalHUD world={world} openMap={() => setModal('map')} notice={notice} />
        )}
        {(world.map === 'chelsea' || world.map === 'chelsea-museum') && (
          <ChelseaHUD world={world} openMap={() => setModal('map')} notice={notice} />
        )}
        {world.map === 'hall-of-legends' && (
          <MuseumHUD
            position={world.position}
            lang={museumLanguage}
            openMap={() => setModal('map')}
            quiz={() => {
              setQuizAnswer(null);
              setModal('quiz');
            }}
            photo={() => emit('screenshot')}
          />
        )}
        {world.map === 'united' && (
          <div className="cave-wayfinding" aria-label="Chỉ dẫn trong hang">
            <span>HANG QUỶ ĐỎ · NƠI TRÚ ẨN CỦA FAN</span>
            <strong>
              {world.position.x < 1250 && world.position.y > 1250 && world.position.y < 1800
                ? 'Góc Tâm Sự Fan · Trà nóng, có anh em.'
                : world.position.y < 1480 && world.position.x > 1850 && world.position.x < 2250
                  ? 'Hành lang Phòng Truyền Thống · Tiến về ánh đèn vàng'
                  : 'Sảnh Trú Ẩn · Thua một trận, còn cả hội ở đây.'}
            </strong>
            <small>← Góc tâm sự · ↑ Phòng Truyền Thống · ↓ Cổng Ra Hang</small>
          </div>
        )}
        <button
          className="jump-control"
          aria-label="Nhảy"
          disabled={!playing || !!modal}
          onClick={() => emit('jump')}
        >
          <span>↑</span>Nhảy<kbd>Space</kbd>
        </button>
        <div className="world-vignette" />
        <div className="area-card panel">
          <span className="area-icon">
            <Compass size={23} />
          </span>
          <div>
            <small>THẾ GIỚI HANG BÓNG ĐÁ</small>
            <h1>{area}</h1>
            <p>
              <i className={online ? 'status-dot' : 'status-dot demo'} />
              {online ? `Realtime · ${roomCount} người trong phòng` : 'Khám phá 3D ngoại tuyến'}
              <span className="area-dot">•</span>3D Playtest
            </p>
          </div>
          <button className="icon-button" onClick={() => setModal('map')} aria-label="Xem khu vực">
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="world-title" hidden={world.map !== 'plaza'}>
          <span>CHUNG NHỊP ĐẬP. KHÁC MÀU ÁO.</span>
          <p>Một thế giới, ngàn đam mê.</p>
        </div>
        <aside className="map-widget panel">
          <div className="widget-heading">
            <span>
              <Map size={13} /> BẢN ĐỒ KHU VỰC
            </span>
            <button onClick={() => setModal('map')} aria-label="Phóng to bản đồ">
              <Maximize size={13} />
            </button>
          </div>
          <Minimap
            map={world.map}
            position={world.position}
            heading={world.direction}
            onClick={() => setModal('map')}
          />
          <div className="map-footer">
            <span>
              <i /> Vị trí của bạn
            </span>
            <span>{world.map === 'plaza' ? '9 HANG · 3 TẦNG' : 'TRONG HANG'}</span>
          </div>
        </aside>
        <div className="explore-note">
          <span className="tiny-line" />
          <span>ĐI MỘT VÒNG. TÌM ĐỒNG ĐỘI.</span>
          <ArrowUpRight size={13} />
        </div>
        {welcome && !playing && (
          <section className="welcome-card panel">
            <div className="eyebrow">
              <span className="status-dot" /> CHÀO MỪNG ĐẾN VỚI HỘI
            </div>
            <h2>
              Bóng đá có hội.
              <br />
              Vào hang có nhau.
            </h2>
            <p>Chọn màu áo, gặp đồng đội và khám phá thế giới dành riêng cho fan bóng đá.</p>
            <button className="primary" onClick={() => setModal('join')} disabled={!ready}>
              {ready ? 'Vào thế giới' : 'Đang dựng thế giới…'} <ArrowUpRight size={18} />
            </button>
            <small>Miễn phí tham gia · Không cần tài khoản</small>
          </section>
        )}
        {playing && (
          <div className="player-card panel">
            <span className="avatar-dot" style={{ background: team.color }}>
              {team.icon}
            </span>
            <div>
              <strong>{profile.nickname}</strong>
              <span>
                {team.short} · {isGuest ? 'Khách' : 'Thành viên'}
              </span>
            </div>
            <button onClick={invite} aria-label="Mời bạn bè">
              {copied ? <Check size={16} /> : <Users size={16} />}
            </button>
          </div>
        )}
        {world.near && playing && (
          <button className="interaction-prompt" onClick={interact}>
            <kbd>{muStation ? 'F' : 'E'}</kbd>
            <span>
              {cityRoom ? cityInteractionLabel(world.near.id, cityLang, world.seated)
                : muStation
                ? `${muLabels.inspect} · ${muStation.title[museumLanguage]}`
                : muMuseum && world.near.id === 'hall-exit'
                  ? muLabels.exit
                  : muMuseum && world.near.id === 'hall-photo' && museumLanguage === 'en'
                    ? 'Take a photo'
                    : world.near.label}
            </span>
            <ChevronRight size={16} />
          </button>
        )}
        {chatVisible ? (
          <section className="chat-panel panel">
            <div className="chat-tabs">
              {[
                {
                  id: 'room',
                  label: cityRoom ? cityText(cityLang, CITY_COPY.hall) : liverpoolRoom
                    ? world.map === 'liverpool'
                      ? 'Hang Liverpool'
                      : 'Truyền Thống'
                    : arsenalRoom
                      ? world.map === 'arsenal'
                        ? 'Hang Arsenal'
                        : 'Truyền Thống'
                      : world.map === 'chelsea'
                        ? 'Hang The Blues'
                        : world.map === 'chelsea-museum'
                          ? 'Truyền Thống'
                          : world.map === 'united'
                            ? 'Hang Quỷ Đỏ'
                            : isRefuge(world.map) ? area : 'Khu vực',
                },
                { id: 'nearby', label: 'Gần bạn' },
              ].map(({ id: t, label }) => (
                <button
                  className={chatTab === t ? 'active' : ''}
                  key={t}
                  onClick={() => {
                    setChatTab(t);
                    if (t === 'nearby')
                      notice(
                        'Tin nhắn chỉ gửi đến người trong cùng phòng, cách bạn dưới 600 đơn vị.',
                      );
                  }}
                >
                  {t === 'room' && <span className="status-dot" />}
                  {label}
                </button>
              ))}
              <button disabled title="Chat toàn cầu chưa triển khai" className="global-chat">
                Toàn cầu
              </button>
              <button
                className="collapse"
                onClick={() => setChatVisible(false)}
                aria-label="Ẩn chat"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="chat-content">
              <p className="chat-system">
                <Sparkles size={13} /> Cà khịa văn minh, đam mê hết mình.
              </p>
              {messages
                .filter(
                  (m) =>
                    !blocked.has(m.playerId) &&
                    (m.system || (m.map === world.map && (m.channel || 'room') === chatTab)),
                )
                .map((m) => (
                  <div className={`chat-message ${m.system ? 'system' : ''}`} key={m.id}>
                    <span
                      className="chat-avatar"
                      style={{ color: TEAMS.find((t) => t.id === m.team)?.color }}
                    >
                      {TEAMS.find((t) => t.id === m.team)?.icon}
                    </span>
                    <p>
                      <button
                        onClick={() => !m.system && setSelected(m)}
                        style={{ color: TEAMS.find((t) => t.id === m.team)?.color }}
                      >
                        {m.nickname}
                        {m.system ? '' : ' '}
                      </button>{' '}
                      <span>{m.text}</span>
                    </p>
                  </div>
                ))}
              {messages.length === 0 && (
                <div className="chat-empty">
                  <MessageCircle size={22} />
                  <span>
                    Chuyện bóng đá bắt đầu từ một lời chào.
                    <br />
                    <small>Vào thế giới để trò chuyện cùng mọi người.</small>
                  </span>
                </div>
              )}
              <div ref={chatEnd} />
            </div>
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                send();
                input.current?.blur();
              }}
            >
              <input
                ref={input}
                placeholder={playing ? 'Nhắn gì đó vui nào…' : 'Vào thế giới để chat…'}
                value={text}
                maxLength={180}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => emit('block', true)}
                onBlur={() => emit('block', !!modal)}
                aria-label="Tin nhắn chat"
              />
              <button
                type="button"
                className="emoji-small"
                onClick={() => setEmojiOpen((v) => !v)}
                aria-label="Chọn biểu cảm"
              >
                <Smile size={18} />
              </button>
              <button type="submit" className="send-btn" aria-label="Gửi tin nhắn">
                <Send size={16} />
              </button>
            </form>
            <div className="chat-caption">
              <span>
                {online ? <Wifi size={10} /> : <WifiOff size={10} />}{' '}
                {online
                  ? 'Trò chuyện realtime trong phòng'
                  : 'Demo ngoại tuyến · Tin nhắn trên thiết bị'}
              </span>
              <span>ENTER ↵</span>
            </div>
          </section>
        ) : (
          <button className="chat-reopen panel" onClick={() => setChatVisible(true)}>
            <MessageCircle size={18} /> Mở trò chuyện
          </button>
        )}
        <div className="movement-hint">
          <Joystick />
          <span>
            <kbd>W</kbd>
            <div>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </div>
            <small>Di chuyển</small>
          </span>
        </div>
        <ActionBar
          chat={() => {
            setChatVisible(true);
            setTimeout(() => input.current?.focus(), 20);
          }}
          emoji={() => setEmojiOpen((v) => !v)}
          shop={() => setModal('shop')}
          emojiOpen={emojiOpen}
          interact={interact}
          canInteract={playing && !!world.near}
          interactionKey={muStation ? 'F' : 'E'}
          minigame={() => {
            if (world.map === 'plaza' && world.near?.id === 'minigame') setModal('minigame');
            else
              notice('Đến Sân Minigame phía trước bên phải quảng trường, tới gần bóng rồi nhấn E.');
          }}
        />
        {playing && <WorldSignposts open={() => setModal('shop')} />}
        {emojiOpen && (
          <div className="emoji-menu panel">
            <div>
              {EMOJIS.map((e) => (
                <button onClick={() => emoji(e)} key={e}>
                  {e}
                </button>
              ))}
            </div>
            <p>THÊM MỘT CHÚT GIA VỊ</p>
            {STICKERS.map((s) => (
              <button className="sticker" onClick={() => send(s)} key={s}>
                {s}
                <Send size={12} />
              </button>
            ))}
          </div>
        )}
        <AdvanceControl enabled={playing} />
        <div className="right-tools">
          <button
            className="round-button"
            onClick={() => setModal('settings')}
            aria-label="Cài đặt"
          >
            <Settings2 size={18} />
          </button>
          <button
            className="round-button"
            onClick={() => {
              document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement
                    .requestFullscreen()
                    .catch(() => notice('Trình duyệt chưa hỗ trợ toàn màn hình.'));
            }}
            aria-label="Toàn màn hình"
          >
            <Maximize size={18} />
          </button>
        </div>
        <div className="bottom-status">
          <span>
            <i className="status-dot" />
            {world.fps} FPS
          </span>
          <span>v0.2 · Three.js + R3F</span>
          <span>Được tạo bằng đam mê ⚽</span>
        </div>
        {(!ready || !playing) && (
          <div className="loading-world">
            <Tent size={45} />
            <p>Đang thắp đèn trong hang…</p>
          </div>
        )}
      </main>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          {toast}
          <button onClick={() => setToast('')} aria-label="Đóng thông báo">
            <X size={15} />
          </button>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section className="modal small" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>
              <X size={19} />
            </button>
            <h2>{selected.nickname}</h2>
            <p>{selected.text}</p>
            <button
              className="secondary"
              onClick={() => {
                setBlocked((v) => new Set([...v, selected.playerId]));
                setSelected(null);
                notice('Đã ẩn tin nhắn của người chơi này trong phiên.');
              }}
            >
              <EyeOff size={16} /> Chặn tin nhắn trong phiên
            </button>
            <button
              className="secondary"
              onClick={() => {
                if (socket.connected)
                  socket.emit('report', {
                    messageId: selected.id,
                    reason: 'Nội dung không phù hợp',
                  });
                else notice('Đang offline. Không thể gửi báo cáo đến máy chủ.');
                setSelected(null);
              }}
            >
              <Flag size={16} /> Báo cáo nội dung
            </button>
          </section>
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section
            className={`modal ${modal === 'map' ? 'wide' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === 'join'
                ? 'Tạo nhân vật'
                : modal === 'shop'
                  ? 'Quầy Cà Khịa'
                  : 'Thông tin game'
            }
          >
            <button className="close" onClick={() => setModal(null)} aria-label="Đóng">
              <X size={20} />
            </button>
            {cityRoom && modal === 'city-collection' && <CityCollection key={citySection} section={citySection} lang={cityLang} />}
            {cityRoom && modal === 'exhibit' && <CityCollection key={exhibitId} section="overview" id={exhibitId} lang={cityLang} />}
            {modal === 'exhibit' && kopExhibit && (
              <MuseumExhibitPanel
                key={kopExhibit.id}
                exhibit={kopExhibit}
                hall="PHÒNG TRUYỀN THỐNG LIVERPOOL FC"
                club="Liverpool FC"
                verifiedAt={LIVERPOOL_VERIFIED_AT}
              />
            )}
            {modal === 'exhibit' && gunnersExhibit && (
              <MuseumExhibitPanel
                key={gunnersExhibit.id}
                exhibit={gunnersExhibit}
                hall="THE GUNNERS HERITAGE HALL"
                club="Arsenal"
                verifiedAt={ARSENAL_VERIFIED_AT}
              />
            )}
            {modal === 'exhibit' && bluesExhibit && (
              <ChelseaExhibitPanel key={bluesExhibit.id} exhibit={bluesExhibit} />
            )}
            {modal === 'exhibit' && muMuseum && (
              <RedDevilsExhibitPanel
                key={exhibitId}
                id={exhibitId}
                lang={museumLanguage}
                close={() => setModal(null)}
              />
            )}
            {modal === 'quiz' && (
              <>
                <div className="eyebrow">ĐỐ VUI LỊCH SỬ</div>
                <h2>Chiếc cúp châu Âu đầu tiên?</h2>
                <p>Manchester United lần đầu vô địch European Cup vào năm nào?</p>
                <div className="map-legend">
                  {[1958, 1968, 1999].map((y) => (
                    <button className="primary" key={y} onClick={() => setQuizAnswer(y)}>
                      {y}
                    </button>
                  ))}
                </div>
                {quizAnswer && (
                  <p role="status">
                    {quizAnswer === 1968
                      ? 'Chính xác! United thắng Benfica 4–1 tại Wembley.'
                      : 'Chưa đúng. Hãy ghé khu lịch sử để tìm câu trả lời.'}
                  </p>
                )}
              </>
            )}
            {modal === 'join' && (
              <>
                <div className="modal-symbol">
                  <Tent size={30} />
                </div>
                <div className="eyebrow">MỘT CHỖ TRONG HỘI ĐANG CHỜ BẠN</div>
                <h2>
                  Chọn màu áo.
                  <br />
                  Bắt đầu câu chuyện.
                </h2>
                <p>Không cần tài khoản. Chỉ cần chung một đam mê.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    start();
                  }}
                >
                  <label className="field-label">
                    TÊN NHÂN VẬT
                    <input
                      autoFocus
                      placeholder="Anh em gọi bạn là gì?"
                      value={profile.nickname}
                      maxLength={20}
                      minLength={2}
                      required
                      onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                    />
                  </label>
                  <label className="field-label">MÀU ÁO CỦA BẠN</label>
                  <div className="team-grid">
                    {TEAMS.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        className={profile.team === t.id ? 'chosen' : ''}
                        onClick={() => setProfile({ ...profile, team: t.id })}
                      >
                        <b style={{ color: t.color }}>{t.icon}</b>
                        {t.short}
                        {profile.team === t.id && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                  <label className="field-label">CHỌN DIỆN MẠO</label>
                  <div className="avatar-grid">
                    {['🧑🏻', '🧑🏽', '👩🏻', '🧑🏾'].map((a, i) => (
                      <button
                        type="button"
                        className={profile.avatar === i ? 'chosen' : ''}
                        onClick={() => setProfile({ ...profile, avatar: i })}
                        key={a}
                        aria-label={`Avatar ${i + 1}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <button className="primary" type="submit">
                    Vào thế giới <ArrowUpRight size={18} />
                  </button>
                </form>
                <small className="footnote">
                  Hãy thân thiện. Sau tiếng còi, chúng ta vẫn là anh em.
                </small>
              </>
            )}
            {modal === 'map' && (
              <>
                <div className="eyebrow">LA BÀN CỦA NGƯỜI HÂM MỘ</div>
                <h2>Mỗi hang, một câu chuyện.</h2>
                <p>
                  Đi đến một cổng phát sáng và nhấn <kbd>E</kbd> để vào hang. Chấm sáng là vị trí
                  của bạn.
                </p>
                <Minimap
                  large
                  map={world.map}
                  position={world.position}
                  heading={world.direction}
                />
                <div className="map-legend">
                  {(cityRoom
                    ? (['hall', 'lounge', 'museum', 'tunnel'] as const).map((id) => ({ id, short: cityText(cityLang, CITY_COPY[id]), color: '#7dd3ff' }))
                    : liverpoolRoom
                    ? (world.map === 'liverpool' ? KOP_CAVE : KOP_MUSEUM).zones.map((z) => ({
                        ...z,
                        short: z.label,
                        color: '#efbd75',
                      }))
                    : arsenalRoom
                      ? (world.map === 'arsenal' ? ARSENAL_CAVE : ARSENAL_MUSEUM).zones.map(
                          (z) => ({
                            ...z,
                            short: z.label,
                            color: '#edb468',
                          }),
                        )
                      : world.map === 'chelsea' || world.map === 'chelsea-museum'
                        ? (world.map === 'chelsea' ? BLUES_CAVE : BLUES_MUSEUM).zones.map((z) => ({
                            ...z,
                            short: z.label,
                            color: '#75b6ff',
                          }))
                        : world.map === 'hall-of-legends'
                          ? HALL.zones.map((z) => ({ ...z, short: museumLanguage === 'en' ? z.en : z.label, color: '#e6af61' }))
                          : world.map === 'united'
                            ? RED_CAVE.zones
                                .filter((z) => !['fun', 'event'].includes(z.id))
                                .map((z) => ({ id: z.id, short: z.label, color: z.color }))
                            : isRefuge(world.map)
                              ? [{ id: 'refuge', short: 'Sảnh Trú Ẩn', color: '#e6af61' }, { id: 'exit', short: 'Đường hầm', color: '#c49b77' }]
                              : CAVES.map((c) => ({ id: c.id, short: c.short, color: c.color }))
                  ).map((t) => (
                    <span key={t.id}>
                      <i style={{ background: t.color }} />
                      {t.short}
                    </span>
                  ))}
                </div>
                <div className="map-coordinates">
                  <span>{area}</span>
                  <span>
                    X {Math.round(world.position.x)} · Y {Math.round(world.position.y)}
                  </span>
                </div>
              </>
            )}
            {(['minigame', 'prediction', 'ranking', 'wallet'] as string[]).includes(
              modal || '',
            ) && <GrandPanel kind={modal as 'minigame' | 'prediction' | 'ranking' | 'wallet'} />}
            {modal === 'help' && (
              <>
                <div className="modal-symbol">
                  <Compass size={29} />
                </div>
                <div className="eyebrow">CẨM NANG NHẬP HỘI</div>
                <h2>Vào hang, đừng ngại.</h2>
                <p>Một thế giới nhỏ dành cho những đam mê lớn.</p>
                <div className="help-list">
                  <div>
                    <Footprints />
                    <span>
                      <strong>Đi một vòng thế giới</strong>
                      <p>
                        Dùng WASD, phím mũi tên hoặc joystick. Kéo chuột hoặc vuốt trên cảnh để xoay
                        camera 360°; cuộn để zoom, R để đưa camera về phía sau.
                      </p>
                    </span>
                  </div>
                  <div>
                    <Tent />
                    <span>
                      <strong>Gõ cửa một hang</strong>
                      <p>
                        Cửa các hang tự mở khi bạn đến gần từ cả hai phía. Theo đường hầm để đi
                        giữa Đại Sảnh Chung và Sảnh Trú Ẩn.
                      </p>
                    </span>
                  </div>
                  <div>
                    <MessageCircle />
                    <span>
                      <strong>Bắt chuyện cùng đồng đội</strong>
                      <p>Nhấn Enter để chat. Bấm tên người chơi để chặn tin nhắn hoặc báo cáo.</p>
                    </span>
                  </div>
                  <div>
                    <Smile />
                    <span>
                      <strong>Cà khịa có duyên</strong>
                      <p>
                        Chọn biểu cảm hoặc xem thử hiệu ứng. Vui cùng bóng đá, tôn trọng mọi người.
                      </p>
                    </span>
                  </div>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    if (playing) setModal(null);
                    else setModal('join');
                  }}
                >
                  Hiểu rồi, đi thôi <ArrowUpRight size={18} />
                </button>
              </>
            )}
            {modal === 'shop' && (
              <>
                <div className="modal-symbol orange">
                  <Megaphone size={30} />
                </div>
                <div className="eyebrow">THÊM GIA VỊ CHO TRẬN ĐẤU</div>
                <h2>Cà khịa vui thôi!</h2>
                <p>Đam mê hết mình, trêu nhau có chừng mực.</p>
                <div className="preview-badge">
                  <EyeOff size={14} /> CHẾ ĐỘ XEM THỬ · KHÔNG THANH TOÁN
                </div>
                <div className="effects-list">
                  {[
                    {
                      id: 'tomato',
                      emoji: '🍅',
                      name: 'Mưa cà chua',
                      desc: 'Một cơn mưa đậm vị bóng đá.',
                      price: '3.000đ',
                    },
                    {
                      id: 'speaker',
                      emoji: '📣',
                      name: 'Loa cà khịa',
                      desc: 'Phong độ là nhất thời!',
                      price: '5.000đ',
                    },
                    {
                      id: 'banner',
                      emoji: '🏳️',
                      name: 'Banner hẹn mùa sau',
                      desc: 'Thông điệp có sẵn, đã giới hạn nội dung.',
                      price: '10.000đ',
                    },
                    {
                      id: 'confetti',
                      emoji: '🎉',
                      name: 'Pháo giấy ăn mừng',
                      desc: 'Chung vui một khoảnh khắc.',
                      price: 'Miễn phí',
                    },
                  ].map((e) => (
                    <div className="effect-item" key={e.id}>
                      <span>{e.emoji}</span>
                      <div>
                        <strong>{e.name}</strong>
                        <p>{e.desc}</p>
                        <small>{e.price === 'Miễn phí' ? e.price : `Giá dự kiến ${e.price}`}</small>
                      </div>
                      <button onClick={() => preview(e.id)}>
                        Xem thử <ArrowUpRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <small className="footnote">
                  Hiệu ứng chỉ hiển thị trên thiết bị của bạn. Giãn cách 4 giây. Chưa mở bán; thanh
                  toán chỉ được kích hoạt khi có backend xác thực.
                </small>
              </>
            )}
            {modal === 'support' && (
              <>
                <div className="modal-symbol">
                  <Heart size={29} />
                </div>
                <div className="eyebrow">CÙNG GIỮ NGỌN LỬA ĐAM MÊ</div>
                <h2>
                  Một chút yêu thương.
                  <br />
                  Một thế giới lớn hơn.
                </h2>
                <p>
                  {config.supportText ||
                    'Sự đồng hành của bạn giúp thắp sáng thêm những hang mới và mang anh em lại gần nhau.'}
                </p>
                <div className="support-state">
                  <Heart size={32} />
                  <strong>
                    {config.supportUrl
                      ? 'Cảm ơn bạn đã đồng hành!'
                      : 'Cổng ủng hộ đang được chuẩn bị'}
                  </strong>
                  <p>
                    {config.supportUrl
                      ? 'Bạn sẽ đến trang ủng hộ đã cấu hình cho dự án.'
                      : 'Hiện chưa cấu hình tài khoản hoặc liên kết nhận ủng hộ. Bạn vẫn có thể ủng hộ bằng cách rủ bạn bè cùng chơi.'}
                  </p>
                </div>
                {config.supportUrl && /^https:\/\//.test(config.supportUrl) ? (
                  <a className="primary" href={config.supportUrl} target="_blank" rel="noreferrer">
                    Đến trang ủng hộ <ArrowUpRight size={17} />
                  </a>
                ) : (
                  <button className="primary" onClick={invite}>
                    {copied ? <Check size={17} /> : <Copy size={17} />} Mời bạn bè đến chơi
                  </button>
                )}
              </>
            )}
            {modal === 'score' && demoMatch && (
              <>
                <div className="eyebrow">{demoMatch.label}</div>
                <h2>
                  {demoMatch.home} {demoMatch.score} {demoMatch.away}
                </h2>
                <p>
                  {demoMatch.time} · {demoMatch.caption}
                </p>
                {world.map === 'liverpool' && (
                  <p>
                    Trạng thái: {liverpoolDemo.status}. {liverpoolDemo.message}
                  </p>
                )}
                <p>
                  Đây là dữ liệu minh họa. Chưa kết nối API kết quả trực tiếp; người chơi luôn tự do
                  vào và ra hang.
                </p>
              </>
            )}
            {modal === 'score' && cityRoom && <CityMatchBoard lang={cityLang} news={cityNews} chat={() => {
              setModal(null);
              setChatVisible(true);
            }} />}
            {modal === 'score' && !demoMatch && !cityRoom && (
              <>
                <div className="eyebrow">GÓC BÓNG ĐÁ · DỮ LIỆU MINH HỌA</div>
                <h2>Hết trận, còn câu chuyện.</h2>
                <div className="score-card">
                  <span>ĐỘI ĐỎ</span>
                  <strong>0 : 3</strong>
                  <span>ĐỘI XANH</span>
                </div>
                <p>
                  Tỉ số trên bảng là dữ liệu minh họa cho cảnh game, không phải kết quả trận đấu
                  thực tế.
                </p>
                <div className="info-box">
                  Chưa kết nối nguồn dữ liệu bóng đá. Khu vực này có thể tích hợp lịch thi đấu và
                  kết quả từ API có giấy phép.
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    setModal(null);
                    setChatVisible(true);
                  }}
                >
                  Ra khán đài trò chuyện <MessageCircle size={17} />
                </button>
              </>
            )}
            {(modal === 'statue' || modal === 'board') && (
              <>
                <div className="modal-symbol orange">
                  <Flame size={30} />
                </div>
                <div className="eyebrow">
                  {world.map === 'chelsea' ? 'HANG THE BLUES' : 'HANG QUỶ ĐỎ'} · SẢNH TRÚ ẨN
                </div>
                <h2>{modal === 'statue' ? 'Ngọn lửa chung một hội.' : 'Hôm nay trong hang.'}</h2>
                <p>
                  {modal === 'statue'
                    ? world.map === 'united'
                      ? 'Thua một trận, còn cả hội ở đây. Sảnh Trú Ẩn dành cho những lúc cần một tách trà và vài người bạn hiểu cảm giác của mình.'
                      : 'Quả bóng vàng là biểu tượng gốc của Hội Vào Hang. Mỗi màu áo đều có chỗ tại quảng trường này.'
                    : 'Hoạt động từ cấu hình MVP. Bạn có thể tự do tham gia cùng bạn bè.'}
                </p>
                {(world.map === 'united'
                  ? [
                      {
                        title: 'Trà nóng ở Góc Tâm Sự',
                        detail:
                          'Ghé lounge bên trái, ngồi cùng hội và chia sẻ câu chuyện sau trận. Cà khịa vừa đủ, động viên thật nhiều.',
                      },
                      {
                        title: 'Ngày xưa ta đã từng…',
                        detail:
                          'Đi vòng bục trung tâm, vào hành lang phía sau để đến Phòng Truyền Thống. Cúp, huyền thoại và những ký ức vinh quang đang chờ.',
                      },
                    ]
                  : CAVE_EVENTS
                ).map((e) => (
                  <div className="info-box" key={e.title}>
                    <strong>{e.title}</strong>
                    <br />
                    {e.detail}
                  </div>
                ))}
                <button className="primary" onClick={() => setModal(null)}>
                  Tiếp tục khám phá <Footprints size={17} />
                </button>
              </>
            )}
            {modal === 'event' && (
              <>
                <div className="modal-symbol">
                  <Flame size={30} />
                </div>
                <div className="eyebrow">ĐẤU TRƯỜNG · KHU GIAO LƯU</div>
                <h2>
                  Khác màu áo.
                  <br />
                  Chung một tình yêu.
                </h2>
                <p>
                  Đấu đối kháng và lịch sự kiện trực tuyến chưa phát hành. Hiện bạn có thể gặp gỡ,
                  gửi biểu cảm và chat tại khu vực này.
                </p>
                <div className="info-box">
                  {CAVE_EVENTS.map((e) => (
                    <p key={e.title}>
                      <strong>{e.title}</strong>
                      <br />
                      {e.detail}
                    </p>
                  ))}
                </div>
                <button className="primary" onClick={invite}>
                  <Copy size={17} /> Sao chép lời mời
                </button>
                <small className="footnote">
                  {config.sponsor
                    ? `Nội dung tài trợ: ${config.sponsor}`
                    : 'Vị trí dành cho nhà tài trợ · Hiện chưa có nội dung tài trợ.'}
                </small>
              </>
            )}
            {modal === 'settings' && (
              <>
                <div className="eyebrow">GÓC CỦA BẠN</div>
                <h2>Thoải mái mà chơi.</h2>
                <div className="settings-row">
                  <span>Camera tự xoay</span>
                  <button
                    className="secondary"
                    aria-label="Camera tự xoay"
                    aria-pressed={cameraSettings.autoRotate}
                    onClick={() => setCameraSettings((v) => ({ ...v, autoRotate: !v.autoRotate }))}
                  >
                    {cameraSettings.autoRotate ? 'Đang bật' : 'Đang tắt'}
                  </button>
                </div>
                <label className="settings-row">
                  <span>Độ nhạy xoay chuột</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={cameraSettings.sensitivity}
                    aria-valuetext={`${Math.round(cameraSettings.sensitivity * 100)}%`}
                    onChange={(e) =>
                      setCameraSettings((v) => ({ ...v, sensitivity: e.target.valueAsNumber }))
                    }
                  />
                </label>
                <label className="settings-row">
                  <span>Khoảng cách camera</span>
                  <select
                    value={cameraSettings.distance}
                    onChange={(e) => {
                      const distance = e.target.value as typeof cameraSettings.distance;
                      setCameraSettings((v) => ({ ...v, distance }));
                    }}
                  >
                    <option value="near">Gần</option>
                    <option value="medium">Trung bình</option>
                    <option value="far">Xa</option>
                  </select>
                </label>
                <div className="settings-row">
                  <span>Chất lượng 3D</span>
                  <select
                    aria-label="Chất lượng 3D"
                    value={world.quality || (window.innerWidth < 700 ? 'low' : 'medium')}
                    onChange={(e) => emit('quality', e.target.value)}
                  >
                    <option value="low">Low · Nhẹ</option>
                    <option value="medium">Medium · Cân bằng</option>
                    <option value="high">High · Bloom & bóng đổ</option>
                  </select>
                </div>
                <div className="settings-row">
                  <span>Giảm hiệu ứng</span>
                  <button
                    className="secondary"
                    aria-pressed={reduced}
                    onClick={() => setReduced((v) => !v)}
                  >
                    {reduced ? 'Đang bật' : 'Đang tắt'}
                  </button>
                </div>
                <div className="settings-row">
                  <span>Khung trò chuyện</span>
                  <button className="secondary" onClick={() => setChatVisible((v) => !v)}>
                    {chatVisible ? 'Đang hiển thị' : 'Đang ẩn'}
                  </button>
                </div>
                <div className="settings-row">
                  <span>Kết nối máy chủ</span>
                  <strong>{online ? 'Realtime' : 'Demo / đang kết nối lại'}</strong>
                </div>
                <div className="info-box">
                  {window.location.pathname === '/playtest'
                    ? 'Đây là bản chơi thử với hồ sơ tạm thời. Đăng nhập ở trang chủ để sử dụng tài khoản và ví.'
                    : 'Hồ sơ, ví xu và vật phẩm được lưu trong Supabase. Vị trí, phòng và chat được xử lý tạm thời trên máy chủ realtime.'}
                </div>
                <button
                  className="secondary"
                  onClick={() => {
                    socket.disconnect();
                    setOnline(false);
                    emit('connected', false);
                    notice('Đã chuyển sang demo ngoại tuyến.');
                  }}
                >
                  Chơi demo ngoại tuyến <WifiOff size={16} />
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    if (playing && (socket.auth as { accessToken?: string }).accessToken)
                      socket.connect();
                    else notice('Đăng nhập ở trang chủ để kết nối multiplayer.');
                  }}
                >
                  Kết nối lại multiplayer <Wifi size={16} />
                </button>
                <button className="primary" onClick={invite}>
                  <Users size={17} /> Mời bạn bè
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
