/**
 * Web Audio API Sound Synthesizer for Gaming Leaderboard Effects
 * Synthesizes retro sounds programmatically so we don't rely on external file hosting.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
        if (!sharedAudioCtx) {
            sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (sharedAudioCtx.state === 'suspended') {
            sharedAudioCtx.resume();
        }
        return sharedAudioCtx;
    } catch (e) {
        console.warn('Web Audio API not supported or blocked:', e);
        return null;
    }
}

/**
 * Play a fast swoosh/click sound representing a physical card flip
 */
export function playFlipSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Fast frequency sweep down to simulate a card flap/whoosh
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
}

/**
 * Play a classic retro ascending level-up/chime sound for Gold, Silver, Bronze reveals
 */
export function playLevelUpSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    // C5 -> E5 -> G5 -> C6
    const chimes = [523.25, 659.25, 783.99, 1046.50];
    const startTime = ctx.currentTime;

    chimes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Use triangle wave for a retro 8-bit game vibe
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + index * 0.08);

        gain.gain.setValueAtTime(0.12, startTime + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + index * 0.08);
        osc.stop(startTime + index * 0.08 + 0.25);
    });
}

/**
 * Play a dramatic GAMING card reveal sound:
 * Deep bass boom + rapid neon sweep + glitch static burst + ascending chime
 */
export function playCardOpenSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. BASS BOOM — deep punch at the start
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(120, now);
    bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    bassGain.gain.setValueAtTime(0.6, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 0.35);

    // 2. NEON SWEEP — high pitch glide down
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(2200, now + 0.05);
    sweepOsc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
    sweepGain.gain.setValueAtTime(0.12, now + 0.05);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweepOsc.start(now + 0.05);
    sweepOsc.stop(now + 0.3);

    // 3. GLITCH BURST — short noise crackle
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.1);

    // 4. CHIME CASCADE — ascending neon power-up tones
    const chimes = [330, 494, 659, 880, 1108, 1480];
    chimes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.18 + i * 0.055);
        gain.gain.setValueAtTime(0.18, now + 0.18 + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + i * 0.055 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.18 + i * 0.055);
        osc.stop(now + 0.18 + i * 0.055 + 0.22);
    });
}
