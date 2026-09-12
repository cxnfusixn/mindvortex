// Approved FLC v5 visual template. Change the version for visual changes.
export const reelTemplate = Object.freeze({
  id: 'studio-demo-v1', width: 1080, height: 1920, fps: 30, duration: 10,
  intro: { duration: 1.8, source: 'CinematicIntro', logoFade: .85, exitStart: 1.15, exitDuration: .65 },
  scenes: [2.4, 2.4, 1.6], outroDuration: 1.8,
  cuts: [1.8, 4.2, 6.6, 8.2],
  swipe: { angle: 35, duration: .3, color: '#35f46a' },
  audio: { preset: 'moody-ambient-v1', sampleRate: 48000, channels: 2, peakDb: -3 },
  layout: { frame: [60,375,960,1200], headline: [72,310,62], logo: [72,144,54], footer: [72,1640,24], url: [72,1710,27] },
  fonts: { headline: 'JetBrains Mono Bold', body: 'Geist', label: 'JetBrains Mono Regular' },
});
export function validateReelScenes(keys) {
  if (!Array.isArray(keys) || keys.length !== 3 || keys.some(k => typeof k !== 'string' || !k.trim()) || new Set(keys.map(k=>k.trim().toLowerCase())).size !== 3)
    throw Error('Provide three distinct website section/asset keys; repeated sections are not allowed.');
}
