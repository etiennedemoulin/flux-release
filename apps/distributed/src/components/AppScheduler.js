import { Engine } from './Engine.js';
import { getRandomNumber } from './utils.js'
import { TransportEvent } from '@ircam/sc-scheduling';

export class AppScheduler {
	constructor(audioContext, transport, params) {
		this.refreshRate = 100;

		this.audioContext = audioContext;
		this.transport = transport;
	    this.params = params;

		this.numChannels = this.audioContext.destination.maxChannelCount;
		this.audioContext.destination.channelCount = this.numChannels;
		this.audioContext.destination.channelCountMode = "explicit";
		this.audioContext.destination.channelInterpretation = 'discrete';
		console.log('> Num Channels:', this.audioContext.destination.channelCount);

		// create merger
		this.merger = this.audioContext.createChannelMerger(this.numChannels);
		this.merger.channelInterpretation = "discrete";
		this.merger.connect(this.audioContext.destination);

		// create engines
		this.engines = new Array(this.numChannels).fill(null);
		for (let i = 0; i < this.engines.length; i++) {
			this.engines[i] = new Engine(this.audioContext);
			this.engines[i].connect(this.merger, 0, i);
		}

		this.enveloppes = {};
		this.enveloppeList = Object.keys(this.enveloppes);

	    // this should not be needed here
	    this.nextCorpusTime = 0;

	    this.updateFunction = null;

	    this.process = this.process.bind(this);
		this.transport.add(this.process);

	}

	onUpdate(c) { 
		this.updateFunction = c;
	}

	updateParams(params) {
		this.params = params;
	}

	updateEnveloppes(env) {
		// console.log("enveloppes", env);
		// no need to stop when update enveloppe
		// this.transport.stop(this.audioContext.currentTime + 1);
		this.enveloppes = {};

		if (env) {
			this.enveloppes = env;
			this.enveloppeList = Object.keys(this.enveloppes);
		}
	}

	updateVolume(vol) {
		const now = this.audioContext.currentTime;

		for (let i = 0; i < this.engines.length; i++) {
		  this.engines[i].master.gain.setValueAtTime(this.engines[i].master.gain.value, now + 0.05);
		  this.engines[i].master.gain.linearRampToValueAtTime(vol, now + 0.1);
		}
	}

	process(currentTime, audioTime, event) {

		if (event instanceof TransportEvent) {
			if (event.type === "start" && this.updateFunction) {
				this.timeoutFunc = setInterval(() => {
					const now = this.transport.currentTime;
					const nextSyncTime = this.nextCorpusTime - this.transport.getPositionAtTime(now);
					this.updateFunction.call(this, {nextSyncTime: nextSyncTime});
					for (let i = 0; i < this.engines.length; i++) {
						this.updateFunction.call(this, {
							id: i,
							volume: this.engines[i].getCurrentVolume(),
							frequency: this.engines[i].getCurrentFrequency()
						});
					}
				}, this.refreshRate);
			}

			if (event.type === "stop") {
				clearInterval(this.timeoutFunc);
				this.updateFunction.call(this, {nextSyncTime: 0});
				for (let i = 0; i < this.engines.length; i++) {
			  		this.engines[i].stop(this.audioContext.currentTime);
			  		this.updateFunction.call(this, {
						id: i,
						volume: 0,
						frequency: this.engines[i].getCurrentFrequency()
					});
				}
			}
			return event.speed > 0 ? currentTime : Infinity;
		}

		const nextCorpus = getRandomNumber(this.params.centerSyncTime, this.params.widthSyncTime, 2);
		this.nextCorpusTime = currentTime + nextCorpus;

		if (this.enveloppeList.length === 0) {
			console.log("no enveloppes loaded");
			return;
		}

		// pick a random new corpus
		const randomInt = Math.floor(Math.random() * this.enveloppeList.length);
		const newCorpus = this.enveloppeList[randomInt];
		const localEnv = structuredClone(this.enveloppes);

		if (this.updateFunction) {
			this.updateFunction.call(this, {corpus: newCorpus});
		}

		for (let i = 0; i < this.engines.length; i++) {

	  		if (!Object.keys(localEnv[newCorpus]).includes(`source ${i+1}`)) {
	  		  break;
	  		}

	  		// main loop
	  		const engine = this.engines[i];
	  
	  		// compute release time
	  		const releaseTime = getRandomNumber(this.params.centerRelease, this.params.widthRelease, 0.01);
	  		engine.triggerRelease(this.audioContext.currentTime, releaseTime);   
			if (this.updateFunction) {
				this.updateFunction.call(this, {id: i, releaseTime: releaseTime});
			}

	  		// change corpus
	  		const folder = localEnv[newCorpus][`source ${i+1}`];
	  		const randomEnv = Math.floor(Math.random() * Object.keys(folder).length);
	  		const envName = Object.keys(folder)[randomEnv];
	  		const currentEnveloppe = folder[envName]; 
	  		currentEnveloppe.name = envName;
	  		if (this.updateFunction) {
				this.updateFunction.call(this, {id: i, enveloppeName: envName});
			}
		
	  		const attackTime = getRandomNumber(this.params.centerAttack, this.params.widthAttack, 0.01);
			currentEnveloppe.attack = attackTime;
			if (this.updateFunction) {
				this.updateFunction.call(this, {id: i, attackTime: attackTime});
			}

	  		// parse for old syntax
	  		if (!currentEnveloppe.enveloppeDuration) {
	  		  currentEnveloppe.enveloppeDuration = 60;
	  		}
		
	  		if (!currentEnveloppe.decayVolume) {
	  		  currentEnveloppe.decayVolume = 0;
	  		}

			// compute nextEventTime
			// trigger new attack at time
			const interDur = getRandomNumber(this.params.centerInterDur, this.params.widthInterDur);
			if (this.updateFunction) {
				this.updateFunction.call(this, {id: i, silenceTime: interDur});
			}

			const nextEvent = this.audioContext.currentTime + releaseTime + interDur;
			const nextEventDuration = nextCorpus - releaseTime - interDur - attackTime;

			// pour affichage uniquement
			this.engines[i].silence = interDur;

			this.engines[i].forever(currentEnveloppe, nextEvent, nextEventDuration); 

		}

	return this.nextCorpusTime;

	}



}