const Sfx = {
  ac: null, master: null, on: true, noiseBuf: null,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ac.createGain();
      this.master.gain.value = 0.45;
      this.master.connect(this.ac.destination);
      const len = this.ac.sampleRate * 0.5;
      this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ac = null; }
  },
  tone(f, d, type = 'sine', v = 0.2, slide = 0, delay = 0) {
    const ac = this.ac; if (!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + d + 0.03);
  },
  noise(d, v = 0.15, freq = 2000, delay = 0) {
    const ac = this.ac; if (!ac || !this.noiseBuf) return;
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = this.noiseBuf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    const g = ac.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + d + 0.02);
  },
  play(n) {
    if (!this.on || !this.ac) return;
    switch (n) {
      case 'click': this.tone(700, 0.05, 'triangle', 0.1); break;
      case 'open': this.tone(520, 0.08, 'sine', 0.12, 220); break;
      case 'close': this.tone(640, 0.07, 'sine', 0.08, -240); break;
      case 'plant': this.tone(300 + Math.random() * 60, 0.09, 'sine', 0.16, 240); this.noise(0.05, 0.05, 1200); break;
      case 'harvest': this.noise(0.1, 0.1, 5000); this.tone(820 + Math.random() * 120, 0.09, 'triangle', 0.09, 340); break;
      case 'coin': this.tone(1320, 0.07, 'square', 0.05); this.tone(1760, 0.16, 'square', 0.05, 0, 0.07); break;
      case 'build': this.noise(0.25, 0.22, 500); this.tone(180, 0.22, 'triangle', 0.15, -60); this.tone(520, 0.12, 'sine', 0.08, 200, 0.15); break;
      case 'error': this.tone(220, 0.14, 'sawtooth', 0.06, -60); break;
      case 'chop': this.noise(0.07, 0.25, 900); this.tone(140, 0.08, 'square', 0.06, -40); this.noise(0.07, 0.2, 900, 0.15); break;
      case 'ding': this.tone(988, 0.2, 'sine', 0.1); this.tone(1319, 0.3, 'sine', 0.08, 0, 0.1); break;
      case 'level': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.14, 0, i * 0.11)); break;
      case 'ach': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.22, 'sine', 0.12, 0, i * 0.08)); break;
      case 'expand': [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.12, 0, i * 0.09)); this.noise(0.4, 0.1, 3000, 0.3); break;
      case 'craft': this.tone(440, 0.08, 'triangle', 0.1, 120); this.tone(660, 0.1, 'triangle', 0.08, 0, 0.08); break;
      case 'pop': this.tone(500, 0.06, 'sine', 0.12, 300); break;
    }
  },
};
