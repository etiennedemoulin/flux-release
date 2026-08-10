export class Engine {
  constructor(audioContext) {
    this.audioContext = audioContext;

    this.osc = this.audioContext.createOscillator();
    this.env = this.audioContext.createGain();
    this.osc.type = "sine";
    this.osc.connect(this.env);

    this.osc2 = this.audioContext.createOscillator();
    this.env2 = this.audioContext.createGain();
    this.osc2.type = "sine";
    this.osc2.connect(this.env2);

    this.env.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.osc.start();

    this.env2.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.osc2.start();

    this.currentEnveloppe = null;
    this.release = 0;
    this.silence = 0;

  }

  forever(enveloppe, time, duration) {
    // same as start without release 
    this.currentEnveloppe = enveloppe;

    const triggerTime = time + 0.05;
    const attackTime = triggerTime + enveloppe.attack;
    const statTime1 = attackTime + enveloppe.stationary1;
    const decayTime = statTime1 + enveloppe.decay / 2;
    const statTime2 = decayTime + enveloppe.stationary2;
    const sustainTime = statTime2 + enveloppe.decay / 2;

    const statTime3 = triggerTime + duration;
    // const releaseTime = statTime3 + this.state.release;

    const volume = enveloppe.volume / 400;
    const decayVolume = enveloppe.sustain / 400;
    const volume2 = enveloppe.volume2 / 400;

    // console.log(Math.pow((volume/2), 0.25), volume);
    let sustainVolume;
    if (enveloppe.stationary3 === 0) {
      sustainVolume = decayVolume;
    } else {
      sustainVolume = volume;
    }

    // enveloppe volume
    this.env.gain.linearRampToValueAtTime(0.0, triggerTime);

    // attack 
    this.env.gain.linearRampToValueAtTime(volume * (Math.pow(0.5, 0.25)), attackTime / 2);
    this.env.gain.linearRampToValueAtTime(volume, attackTime);

    // stationnaire
    this.env.gain.setValueAtTime(volume, statTime1);
    this.env.gain.linearRampToValueAtTime(decayVolume, decayTime);
    this.env.gain.setValueAtTime(decayVolume, statTime2);
    this.env.gain.linearRampToValueAtTime(sustainVolume, sustainTime);
    // this.env.gain.setValueAtTime(sustainVolume, statTime3);
    // this.env.gain.linearRampToValueAtTime(0, releaseTime);

    // enveloppe frequency
    this.osc.frequency.setValueAtTime(enveloppe.startFreq, triggerTime);
    this.osc.frequency.setValueAtTime(enveloppe.startFreq, attackTime);
    this.osc.frequency.linearRampToValueAtTime(enveloppe.endFreq, statTime3);

    // visuel enveloppe
    this.env2.gain.setValueAtTime(0, triggerTime);
    this.env2.gain.linearRampToValueAtTime(volume2, attackTime);
    // this.env2.gain.setValueAtTime(volume2, statTime3);
    // this.env2.gain.linearRampToValueAtTime(0, releaseTime);

    // visuel frequency
    this.osc2.frequency.setValueAtTime(enveloppe.freq2, triggerTime);

  }

  stop() {

    const now = this.audioContext.currentTime;
    
    this.env.gain.cancelScheduledValues(now);
    this.osc.frequency.cancelScheduledValues(now);

    this.env2.gain.cancelScheduledValues(now);
    this.osc2.frequency.cancelScheduledValues(now);

    this.env.gain.linearRampToValueAtTime(this.env.gain.value, now);
    this.env2.gain.linearRampToValueAtTime(this.env2.gain.value, now);

    this.env.gain.linearRampToValueAtTime(0, now + 0.05);
    this.env2.gain.linearRampToValueAtTime(0, now + 0.05);

  }

  triggerRelease(time, release) {
    this.release = release;

    const sustainVolume = this.env.gain.value;

    this.env.gain.cancelScheduledValues(time);
    this.env.gain.linearRampToValueAtTime(sustainVolume, time + 0.01);

    this.env.gain.linearRampToValueAtTime(sustainVolume * (Math.pow(0.66, 0.25)), time + (release * 0.66));
    this.env.gain.linearRampToValueAtTime(0, time + release);

    this.osc.frequency.cancelScheduledValues(time);
    this.osc2.frequency.cancelScheduledValues(time);
    this.osc.frequency.linearRampToValueAtTime(this.osc.frequency.value, time + 0.01);
    this.osc2.frequency.linearRampToValueAtTime(this.osc2.frequency.value, time + 0.01);

    this.env2.gain.cancelScheduledValues(time);
    this.env2.gain.linearRampToValueAtTime(this.env2.gain.value, time + 0.01);
    this.env2.gain.linearRampToValueAtTime(0, time + release + 0.05);

  }

  getCurrentValues() {

    // multiply by 400 because trimmed in start function
    return [
      this.osc.frequency.value,
      this.osc2.frequency.value,
      this.env.gain.value * 400,
      this.env2.gain.value * 400
    ];
  }

  getCurrentEnveloppeName() {
    if (this.currentEnveloppe) {
      return this.currentEnveloppe.name;
    } else {
      return 0
    }
  }

  getRelease() {
    if (this.release) {
      return this.release;
    } else {
      return 0
    }
  }

  getAttack() {
    if (this.currentEnveloppe) {
      return this.currentEnveloppe.attack;
    } else {
      return 0
    }
  }

  getSilence() {
    if (this.silence) {
      return this.silence;
    } else {
      return 0;
    }
  }

  connect(destination, input, output) {
    this.env.connect(destination, input, output);
    this.env2.connect(destination, input, output);
  }

  disconnect() {
    this.env.disconnect();
  }

}