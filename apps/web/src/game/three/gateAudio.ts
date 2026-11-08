let context: AudioContext | undefined;

export function enableGateAudio() {
  if (!window.AudioContext) return;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume().catch(() => {});
}

export function playGateHinge() {
  if (!context) return;
  if (context.state === 'suspended') {
    void context
      .resume()
      .then(() => {
        if (context?.state === 'running') playGateHinge();
      })
      .catch(() => {});
    return;
  }
  if (context.state !== 'running') return;
  const now = context.currentTime;
  const hinge = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  hinge.type = 'sawtooth';
  hinge.frequency.setValueAtTime(92, now);
  hinge.frequency.exponentialRampToValueAtTime(47, now + 1.1);
  filter.type = 'lowpass';
  filter.frequency.value = 430;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.043, now + 0.26);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.38);
  hinge.connect(filter).connect(gain).connect(context.destination);
  hinge.start(now);
  hinge.stop(now + 1.4);
}
