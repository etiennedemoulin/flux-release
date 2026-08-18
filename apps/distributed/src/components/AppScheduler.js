import { Engine } from './Engine.js';
import { getRandomNumber } from './utils.js'
import { TransportEvent } from '@ircam/sc-scheduling';

export class AppScheduler {
	constructor(audioContext, transport) {
		this.audioContext = audioContext;
		this.transport = transport;

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
	    this.params = {
	      centerInterDur:0,
	      widthInterDur:0,
	      centerRelease:0.1,
	      widthRelease:0,
	      centerAttack:0.1,
	      widthAttack:0,
	      centerSyncTime:1,
	      widthSyncTime:0
	    };

	    this.currentCorpus = null;
	    this.volume = 1;

	    // this should not be needed here
	    this.nextCorpusTime = 0;

	    this.process = this.process.bind(this);
		this.transport.add(this.process);

	}

	updateEnveloppes(env) {
		this.transport.stop(this.audioContext.currentTime + 1);
		this.enveloppes = {};

		if (env) {
			this.enveloppes = env;
			this.enveloppeList = Object.keys(this.enveloppes);
		}
	}

	updateParams(params) {
		this.params = params;
	}

	updateVolume() {
		const now = this.audioContext.currentTime;

		for (let i = 0; i < this.engines.length; i++) {
		  this.engines[i].master.gain.setValueAtTime(this.engines[i].master.gain.value, now + 0.05);
		  this.engines[i].master.gain.linearRampToValueAtTime(this.volume, now + 0.1);
		}
	}

	process(currentTime, audioTime, event) {

		console.log("this params ", this.params);

		if (event instanceof TransportEvent) {
			if (event.type === "stop") {
				for (let i = 0; i < this.engines.length; i++) {
			  		this.engines[i].stop(this.audioContext.currentTime);
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
		this.currentCorpus = newCorpus;

		for (let i = 0; i < this.engines.length; i++) {

	  		if (!Object.keys(localEnv[newCorpus]).includes(`source ${i+1}`)) {
	  		  break;
	  		}

	  		// main loop
	  		const engine = this.engines[i];
	  
	  		// compute release time
	  		const releaseTime = getRandomNumber(this.params.centerRelease, this.params.widthRelease, 0.01);
	  		engine.triggerRelease(this.audioContext.currentTime, releaseTime);   

	  		// change corpus
	  		const folder = localEnv[newCorpus][`source ${i+1}`];
	  		const randomEnv = Math.floor(Math.random() * Object.keys(folder).length);
	  		const envName = Object.keys(folder)[randomEnv];
	  		const currentEnveloppe = folder[envName]; 
	  		currentEnveloppe.name = envName;
		
	  		const attackTime = getRandomNumber(this.params.centerAttack, this.params.widthAttack, 0.01);

			currentEnveloppe.attack = attackTime;

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
			const nextEvent = this.audioContext.currentTime + releaseTime + interDur;
			const nextEventDuration = nextCorpus - releaseTime - interDur - attackTime;

			// pour affichage uniquement
			this.engines[i].silence = interDur;

			this.engines[i].forever(currentEnveloppe, nextEvent, nextEventDuration); 

		}

	return this.nextCorpusTime;

	}



}