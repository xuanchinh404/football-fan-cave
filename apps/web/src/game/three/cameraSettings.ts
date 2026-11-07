export const cameraDistances = { near: 4.2, medium: 5.4, far: 6.2 } as const;

export type CameraSettings = {
  autoRotate: boolean;
  sensitivity: number;
  distance: keyof typeof cameraDistances;
};

export const defaultCameraSettings: CameraSettings = {
  autoRotate: true,
  sensitivity: 1,
  distance: 'medium',
};

const storageKey = 'ffc-camera-settings';

export function readCameraSettings(): CameraSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return {
      autoRotate:
        typeof saved.autoRotate === 'boolean' ? saved.autoRotate : defaultCameraSettings.autoRotate,
      sensitivity:
        typeof saved.sensitivity === 'number' && Number.isFinite(saved.sensitivity)
          ? Math.min(2, Math.max(0.5, saved.sensitivity))
          : defaultCameraSettings.sensitivity,
      distance: saved.distance === 'near' || saved.distance === 'far' ? saved.distance : 'medium',
    };
  } catch {
    return defaultCameraSettings;
  }
}

export function saveCameraSettings(settings: CameraSettings) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // Camera settings still apply for the current session if storage is unavailable.
  }
}
