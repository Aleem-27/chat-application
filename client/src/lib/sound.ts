let audioContext: AudioContext | null = null

export function playNotificationSound() {
  try {
    audioContext ??= new AudioContext()
    const ctx = audioContext
    const now = ctx.currentTime

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
    gain.connect(ctx.destination)

    const first = ctx.createOscillator()
    first.type = 'sine'
    first.frequency.setValueAtTime(880, now)
    first.connect(gain)
    first.start(now)
    first.stop(now + 0.15)

    const second = ctx.createOscillator()
    second.type = 'sine'
    second.frequency.setValueAtTime(1174.66, now + 0.1)
    second.connect(gain)
    second.start(now + 0.1)
    second.stop(now + 0.25)
  } catch {
    // Browsers block audio before any user gesture on the page — fail silently, not critical
  }
}