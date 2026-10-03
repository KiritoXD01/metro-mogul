// Synthesizer Audio Utility
export const playSound = (type: string, soundEnabled = true) => {
    if (!soundEnabled) return;
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        if (type === 'build') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
                400,
                ctx.currentTime + 0.15,
            );
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
                0.01,
                ctx.currentTime + 0.15,
            );
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'collect') {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
            osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
            osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.24); // C6
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
                0.01,
                ctx.currentTime + 0.35,
            );
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc1.start();
            osc2.start(ctx.currentTime + 0.24);
            osc1.stop(ctx.currentTime + 0.35);
            osc2.stop(ctx.currentTime + 0.35);
        } else if (type === 'demolish') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
                40,
                ctx.currentTime + 0.2,
            );
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'levelup') {
            const notes = [440, 554.37, 659.25, 880];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(
                    0.01,
                    ctx.currentTime + idx * 0.1 + 0.2,
                );
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.1);
                osc.stop(ctx.currentTime + idx * 0.1 + 0.2);
            });
        }
    } catch {
        // Audio context fallback
    }
};
