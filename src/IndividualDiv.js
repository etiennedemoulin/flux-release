import { LitElement, html, css, nothing } from 'lit';
import { TransportEvent } from '@ircam/sc-scheduling';

import '@ircam/sc-components';
import { getRandomNumber } from './utils.js'

class IndividualDiv extends LitElement {

	static properties = {
		id: {
			type: Number
		},
		currentFreq: { state: true },
		currentVol: { state: true },
		currentFreq2: { state: true },
		currentVol2: { state: true },
		timeoutFunc: { state: true }
	};

	static styles = css`
		.title {
	    	width: 294px;
	    }

	    sc-number {
	    	width: 140px;
	    	margin: 4px;
	    }

	    sc-text {
	    	width: 140px;
	    	margin: 4px;
	    }

	    .separator {
	    	height: 100px;
	    }
	`;

	constructor() {
		super();

		this.id = 0;
		this.engine = null;
		this.transport = null;

		// this.timeoutFunc = null;
		this.currentFreq = 0;
		this.currentFreq2 = 0;
		this.currentVol = 0;
		this.currentVol = 0;

		this.process = this.process.bind(this);
	}

	process(currentTime, processorTime, event) {
		if (event instanceof TransportEvent) {

			if (event.type === "start") {
				// update view on transport event
				this.timeoutFunc = setInterval(() => {
					[ 
						this.currentFreq, 
						this.currentFreq2, 
						this.currentVol, 
						this.currentVol2 
					] = this.engine.getCurrentValues();
	    		}, 50);
			}

			if (event.type === "stop") {
				// stop all engines
				clearInterval(this.timeoutFunc);
				this.currentVol = 0;
				this.currentVol2 = 0;
				this.currentFreq = 0;
				this.currentFreq2 = 0
			}
		return event.speed > 0 ? currentTime : Infinity;
		}

	 

	// #dirty @bug
	// this.requestUpdate();
	return currentTime + 1;

	}

  	connectedCallback() {
  		super.connectedCallback();

	    if (!this.transport.has(this.process)) {
	      this.transport.add(this.process);
	    }
  	}

	disconnectedCallback() {
		super.disconnectedCallback();

		if (this.transport.has(this.process)) {
			this.transport.remove(this.process);
		}
	}

	render() {
		return html`
			<div>
				<sc-text class="title" value="Electroaimant ${this.id + 1}"></sc-text>
			</div>
			<div>
				<sc-text value="Current enveloppe"></sc-text>
				<sc-text value="volume"></sc-text>
				<sc-text value="frequence"></sc-text>
				<sc-text value="release"></sc-text>
				<sc-text value="silence"></sc-text>
				<sc-text value="attack"></sc-text>
			</div>
			<div>
				<sc-text value="${this.engine.getCurrentEnveloppeName()}"></sc-text>
				<sc-text value="${this.currentVol.toFixed(2)}"></sc-text>
				<sc-text value="${this.currentFreq.toFixed(2)}"></sc-text>
				<sc-text value="${this.engine.getRelease().toFixed(2)}"></sc-text>
				<sc-text value="${this.engine.getSilence().toFixed(2)}"></sc-text>
				<sc-text value="${this.engine.getAttack().toFixed(2)}"></sc-text>
			</div>
			<div class="separator"></div>
		`;
	}

}

customElements.define('individual-div', IndividualDiv);