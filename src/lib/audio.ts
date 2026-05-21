class AudioManager {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  enable() {
    this.isEnabled = true;
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  disable() {
    this.isEnabled = false;
  }
  
  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.isEnabled;
  }

  playCoinSound() {
    if (!this.isEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      const t = this.ctx.currentTime;
      
      // Modern professional metallic coin sound (Classic B5 -> E6 arpeggio with rich timbre)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      const mainGain = this.ctx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'square';
      osc3.type = 'triangle';
      
      // Start note: B5 (987.77 Hz)
      const startFreq = 987.77;
      // End note: E6 (1318.51 Hz)
      const endFreq = 1318.51;
      
      // Set initial frequencies
      [osc1, osc2, osc3].forEach(osc => {
        osc.frequency.setValueAtTime(startFreq, t);
        // Fast glide to second note after 100ms
        osc.frequency.setValueAtTime(startFreq, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.09);
      });
      
      // Overall volume envelope
      mainGain.gain.setValueAtTime(0, t);
      // Fast attack for striking the coin
      mainGain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      // Slight decay before the pitch jumps
      mainGain.gain.exponentialRampToValueAtTime(0.15, t + 0.08);
      // Attack for the second note
      mainGain.gain.linearRampToValueAtTime(0.3, t + 0.09);
      // Long tail for the metallic ringing
      mainGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      
      // Mix the oscillators for a "shimmering" metallic sound
      
      // 1. Fundamental sine (smooth body)
      osc1.connect(mainGain);
      
      // 2. Square wave (filtered) adds the metallic "bite"
      const filterSquare = this.ctx.createBiquadFilter();
      filterSquare.type = 'bandpass';
      filterSquare.frequency.setValueAtTime(2500, t);
      filterSquare.Q.value = 1.0;
      const gainSquare = this.ctx.createGain();
      gainSquare.gain.value = 0.08;
      
      osc2.connect(filterSquare);
      filterSquare.connect(gainSquare);
      gainSquare.connect(mainGain);
      
      // 3. Triangle wave (adds high-frequency shimmer, pitched slightly detuned)
      osc3.frequency.setValueAtTime(startFreq * 2.01, t); // Octave up, slightly detuned
      osc3.frequency.setValueAtTime(startFreq * 2.01, t + 0.08);
      osc3.frequency.exponentialRampToValueAtTime(endFreq * 2.01, t + 0.09);
      
      const filterTri = this.ctx.createBiquadFilter();
      filterTri.type = 'highpass';
      filterTri.frequency.setValueAtTime(3000, t);
      const gainTri = this.ctx.createGain();
      gainTri.gain.value = 0.1;
      
      osc3.connect(filterTri);
      filterTri.connect(gainTri);
      gainTri.connect(mainGain);
      
      // Connect to master output
      mainGain.connect(this.ctx.destination);
      
      // Start and stop
      [osc1, osc2, osc3].forEach(osc => {
        osc.start(t);
        osc.stop(t + 0.65);
      });
      
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }
}

export const audioManager = new AudioManager();
