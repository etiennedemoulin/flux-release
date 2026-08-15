export class Engine {
  constructor(audioContext) {
    this.audioContext = audioContext;

    this.osc = this.audioContext.createOscillator();
    this.osc2 = this.audioContext.createOscillator();
    
    this.env = this.audioContext.createGain();
    this.env2 = this.audioContext.createGain();

    this.master = this.audioContext.createGain();
    
    this.osc.type = "sine";
    this.osc.connect(this.env);

    this.osc2.type = "sine";
    this.osc2.connect(this.env2);

    this.env.connect(this.master);

    this.env.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.env2.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.master.gain.setValueAtTime(1, this.audioContext.currentTime);

    this.osc.start();
    this.osc2.start();

    this.currentEnveloppe = null;
    this.silence = 0;

  }

  start(enveloppe, time, duration) {

    this.currentEnveloppe = enveloppe;

    const triggerTime = time + 0.05;
    const halfAttackTime = triggerTime + enveloppe.attack / 2;
    const attackTime = triggerTime + enveloppe.attack;

    const statTime1 = attackTime + (enveloppe.stationary1 / enveloppe.enveloppeDuration * duration);
    const decayTime = statTime1 + ((enveloppe.decay / 2) / enveloppe.enveloppeDuration * duration);
    const statTime2 = decayTime + (enveloppe.stationary2 / enveloppe.enveloppeDuration * duration);
    const sustainTime = statTime2 + ((enveloppe.decay / 2) / enveloppe.enveloppeDuration * duration);

    const releaseTime = attackTime + duration;
    const halfReleaseTime = releaseTime + enveloppe.release * 2/3;
    const endTime = releaseTime + enveloppe.release;

    const volume = enveloppe.volume / 400;
    const volume2 = enveloppe.volume2 / 400;
    const decayVolume = (enveloppe.volume + enveloppe.decayVolume) / 400;

    // enveloppe volume
    this.env.gain.setValueAtTime(0.0, triggerTime);

    // attack 
    this.env.gain.linearRampToValueAtTime(volume * (Math.pow(0.5, 0.25)), halfAttackTime);
    this.env.gain.linearRampToValueAtTime(volume, attackTime);

    // stationnaire
    if (statTime1 < releaseTime) {
      this.env.gain.setValueAtTime(volume, statTime1);
    }

    if (decayTime < releaseTime) {
      this.env.gain.linearRampToValueAtTime(decayVolume, decayTime);
    }

    if (statTime2 < releaseTime) {
      this.env.gain.setValueAtTime(decayVolume, statTime2);
    } 

    if (sustainTime < releaseTime) {
      this.env.gain.linearRampToValueAtTime(volume, sustainTime);
      this.env.gain.setValueAtTime(volume, releaseTime);
      this.env.gain.linearRampToValueAtTime(volume * (Math.pow(0.66, 0.25)), halfReleaseTime);
    } else {
      this.env.gain.setValueAtTime(decayVolume, releaseTime);
      this.env.gain.linearRampToValueAtTime(decayVolume * (Math.pow(0.66, 0.25)), halfReleaseTime);
    }

    // release
    this.env.gain.linearRampToValueAtTime(0, endTime);

    // enveloppe frequency
    this.osc.frequency.setValueAtTime(enveloppe.startFreq, triggerTime);
    this.osc.frequency.setValueAtTime(enveloppe.startFreq, attackTime);
    this.osc.frequency.linearRampToValueAtTime(enveloppe.endFreq, releaseTime);

    // visuel enveloppe
    this.env2.gain.setValueAtTime(0, triggerTime);
    this.env2.gain.linearRampToValueAtTime(volume2, attackTime);
    this.env2.gain.setValueAtTime(volume2, releaseTime);
    this.env2.gain.linearRampToValueAtTime(0, endTime);

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
    if (this.currentEnveloppe) {
      return this.currentEnveloppe.release;
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
    this.master.connect(destination, input, output);
    this.env2.connect(destination, input, output);
  }

  disconnect() {
    this.env.disconnect();
  }

}