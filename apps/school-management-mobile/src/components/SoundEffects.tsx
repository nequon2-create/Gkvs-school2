import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export interface SoundRef {
    playFlip: () => void;
    playWin: () => void;
}

// Browser direct synthesizer for web platform compatibility
let webAudioCtx: any = null;

function getWebAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!webAudioCtx) {
        const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
            webAudioCtx = new AudioCtxClass();
        }
    }
    if (webAudioCtx && webAudioCtx.state === 'suspended') {
        webAudioCtx.resume();
    }
    return webAudioCtx;
}

function playWebFlipSound() {
    try {
        const audioCtx = getWebAudioContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
        console.error('Web flip sound error:', e);
    }
}

function playWebLevelUpSound() {
    try {
        const audioCtx = getWebAudioContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        // 1. BASS BOOM — deep punch at the start
        const bassOsc = audioCtx.createOscillator();
        const bassGain = audioCtx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(120, now);
        bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        bassGain.gain.setValueAtTime(0.6, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        bassOsc.connect(bassGain);
        bassGain.connect(audioCtx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.35);

        // 2. NEON SWEEP — high pitch glide down
        const sweepOsc = audioCtx.createOscillator();
        const sweepGain = audioCtx.createGain();
        sweepOsc.type = 'sawtooth';
        sweepOsc.frequency.setValueAtTime(2200, now + 0.05);
        sweepOsc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
        sweepGain.gain.setValueAtTime(0.12, now + 0.05);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        sweepOsc.connect(sweepGain);
        sweepGain.connect(audioCtx.destination);
        sweepOsc.start(now + 0.05);
        sweepOsc.stop(now + 0.3);

        // 3. GLITCH BURST — short noise crackle
        const bufferSize = Math.floor(audioCtx.sampleRate * 0.08);
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.25, now + 0.1);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start(now + 0.1);

        // 4. CHIME CASCADE — ascending neon power-up tones
        const chimes = [330, 494, 659, 880, 1108, 1480];
        chimes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + 0.18 + i * 0.055);
            gain.gain.setValueAtTime(0.18, now + 0.18 + i * 0.055);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + i * 0.055 + 0.22);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + 0.18 + i * 0.055);
            osc.stop(now + 0.18 + i * 0.055 + 0.22);
        });
    } catch (e) {
        console.error('Web level up sound error:', e);
    }
}

export const SoundEffects = forwardRef<SoundRef>((_, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
        playFlip: () => {
            if (Platform.OS === 'web') {
                playWebFlipSound();
            } else {
                webViewRef.current?.injectJavaScript('playFlipSound(); true;');
            }
        },
        playWin: () => {
            if (Platform.OS === 'web') {
                playWebLevelUpSound();
            } else {
                webViewRef.current?.injectJavaScript('playLevelUpSound(); true;');
            }
        }
    }));

    if (Platform.OS === 'web') {
        return null;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script>
                    let audioCtx = null;
                    function initAudio() {
                        if (!audioCtx) {
                            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        }
                        if (audioCtx.state === 'suspended') {
                            audioCtx.resume();
                        }
                    }
                    
                    function playFlipSound() {
                        try {
                            initAudio();
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(350, audioCtx.currentTime);
                            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.12);
                            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                            gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.12);
                        } catch (e) {
                            console.error('Flip sound synthesis error:', e);
                        }
                    }
                    
                    function playLevelUpSound() {
                        try {
                            initAudio();
                            const now = audioCtx.currentTime;

                            // 1. BASS BOOM — deep punch at the start
                            const bassOsc = audioCtx.createOscillator();
                            const bassGain = audioCtx.createGain();
                            bassOsc.type = 'sine';
                            bassOsc.frequency.setValueAtTime(120, now);
                            bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
                            bassGain.gain.setValueAtTime(0.6, now);
                            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                            bassOsc.connect(bassGain);
                            bassGain.connect(audioCtx.destination);
                            bassOsc.start(now);
                            bassOsc.stop(now + 0.35);

                            // 2. NEON SWEEP — high pitch glide down
                            const sweepOsc = audioCtx.createOscillator();
                            const sweepGain = audioCtx.createGain();
                            sweepOsc.type = 'sawtooth';
                            sweepOsc.frequency.setValueAtTime(2200, now + 0.05);
                            sweepOsc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
                            sweepGain.gain.setValueAtTime(0.12, now + 0.05);
                            sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                            sweepOsc.connect(sweepGain);
                            sweepGain.connect(audioCtx.destination);
                            sweepOsc.start(now + 0.05);
                            sweepOsc.stop(now + 0.3);

                            // 3. GLITCH BURST — short noise crackle
                            const bufferSize = Math.floor(audioCtx.sampleRate * 0.08);
                            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                            const data = buffer.getChannelData(0);
                            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
                            const noise = audioCtx.createBufferSource();
                            noise.buffer = buffer;
                            const noiseGain = audioCtx.createGain();
                            noiseGain.gain.setValueAtTime(0.25, now + 0.1);
                            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                            noise.connect(noiseGain);
                            noiseGain.connect(audioCtx.destination);
                            noise.start(now + 0.1);

                            // 4. CHIME CASCADE — ascending neon power-up tones
                            const chimes = [330, 494, 659, 880, 1108, 1480];
                            chimes.forEach((freq, i) => {
                                const osc = audioCtx.createOscillator();
                                const gain = audioCtx.createGain();
                                osc.type = 'triangle';
                                osc.frequency.setValueAtTime(freq, now + 0.18 + i * 0.055);
                                gain.gain.setValueAtTime(0.18, now + 0.18 + i * 0.055);
                                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + i * 0.055 + 0.22);
                                osc.connect(gain);
                                gain.connect(audioCtx.destination);
                                osc.start(now + 0.18 + i * 0.055);
                                osc.stop(now + 0.18 + i * 0.055 + 0.22);
                            });
                        } catch (e) {
                            console.error('Level up sound synthesis error:', e);
                        }
                    }
                    
                    // Pre-initialize on document load
                    document.addEventListener('DOMContentLoaded', initAudio);
                    window.addEventListener('click', initAudio);
                </script>
            </head>
            <body></body>
        </html>
    `;

    return (
        <WebView
            ref={webViewRef}
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
        />
    );
});

SoundEffects.displayName = 'SoundEffects';

