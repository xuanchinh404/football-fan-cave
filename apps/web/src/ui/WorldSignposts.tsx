import { Flag, Ticket, Sparkles } from 'lucide-react';
export function WorldSignposts({ open }: { open: () => void }) {
  return (
    <aside className="world-signposts" aria-label="Hiệu ứng cà khịa">
      <div className="signpost-pin" />
      <button onClick={open}>
        <Ticket />
        <span>Vé Cà Khịa</span>
        <small aria-hidden="true">XEM THỬ</small>
      </button>
      <button onClick={open}>
        <Flag />
        <span>Treo Banner</span>
      </button>
      <button onClick={open}>
        <Sparkles />
        <span>Hiệu Ứng Đặc Biệt</span>
      </button>
      <p>CÀ KHỊA VUI · KHÔNG MẤT ANH EM</p>
    </aside>
  );
}
