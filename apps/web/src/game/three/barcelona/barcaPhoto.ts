export function barcaPhotoUrl(id: string) {
  return `${import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SERVER_URL || ''}/api/barcelona/photo/${encodeURIComponent(id)}`;
}
