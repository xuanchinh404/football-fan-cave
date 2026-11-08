import { Camera, Footprints, MessageCircle, Megaphone, Smile, Gamepad2 } from 'lucide-react';
import { emit } from '../game/bridge';
export function ActionBar({
  chat,
  emoji,
  shop,
  emojiOpen,
  interact,
  canInteract = false,
  interactionKey = 'E',
  minigame,
}: {
  chat: () => void;
  emoji: () => void;
  shop: () => void;
  emojiOpen: boolean;
  interact?: () => void;
  canInteract?: boolean;
  interactionKey?: string;
  minigame?: () => void;
}) {
  return (
    <div className="bottom-dock">
      <button onClick={chat}>
        <i>
          <MessageCircle size={27} />
        </i>
        <span>Trò chuyện</span>
        <kbd>↵</kbd>
      </button>
      <button className={emojiOpen ? 'selected' : ''} onClick={emoji}>
        <i>
          <Smile size={29} />
        </i>
        <span>Biểu cảm</span>
      </button>
      <button onClick={() => emit('screenshot')}>
        <i>
          <Camera size={28} />
        </i>
        <span>Chụp ảnh</span>
      </button>
      {interact && canInteract && (
        <button
          className="dock-interact"
          onClick={interact}
          disabled={!canInteract}
          aria-label="Tương tác"
        >
          <i>
            <Footprints size={27} />
          </i>
          <span>Tương tác</span>
          <kbd>{interactionKey}</kbd>
        </button>
      )}
      <button className="banter-action" onClick={shop} aria-label="Cà khịa">
        <i>
          <Megaphone size={29} />
        </i>
        <span>Cà khịa</span>
        <b>MỚI</b>
      </button>
      {minigame && (
        <button onClick={minigame}>
          <i>
            <Gamepad2 size={26} />
          </i>
          <span>Minigame</span>
        </button>
      )}
    </div>
  );
}
