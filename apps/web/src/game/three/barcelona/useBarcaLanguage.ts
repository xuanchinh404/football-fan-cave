import { useSyncExternalStore } from 'react';
import {
  barcaLanguage,
  type BarcaLanguage,
} from '../../../../../../packages/shared/barcelona/content';

const key = 'ffc-barcelona-language';
const changed = 'barcelona-language';

function subscribe(listener: () => void) {
  window.addEventListener(changed, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(changed, listener);
    window.removeEventListener('storage', listener);
  };
}
function getLanguage() {
  return barcaLanguage(localStorage.getItem(key) ?? document.documentElement.lang);
}

export function useBarcaLanguage() {
  return useSyncExternalStore(subscribe, getLanguage);
}
export function setBarcaLanguage(lang: BarcaLanguage) {
  localStorage.setItem(key, lang);
  window.dispatchEvent(new Event(changed));
}
