import { LitElement, html, css } from 'lit';

import { loadGroupDirectory } from './window-fs-helpers.js';
import { updateSchema } from './sw-helpers.js';

import './IndividualDistDiv.js';

import '@ircam/sc-components';

		
export class MainDivDistributed extends LitElement {
	static properties = {
	};

	static styles = css`
	.separator {
	  height: 40px;
	}

	.head {
	  width: 200px;
	  margin: 4px;
	}


	sc-text {
	    width: 140px;
	    margin: 4px;
	}

	sc-number {
	    width: 140px;
	    margin: 4px;
	}
	`;

	constructor() {
		super();
		this.mainSchema = null;
    this.currentSchema = null;
    this.indivCollection = null;
	};

	connectedCallback() {
		super.connectedCallback();
		this.mainSchema.onUpdate(updates => { 
			if ('params' in updates) {
				this.params = updates.params;
				this.requestUpdate();
			}
			this.requestUpdate();
    		// console.log(updates); 
  		}, true); 

    this.currentSchema.onUpdate(updates => {
      // console.log(updates);
      this.requestUpdate();
    });

	}

  updateMainSchema() {
    this.mainSchema.set({params: this.params});
  }

	render() {
    const minRA = this.params.centerRelease - (this.params.widthRelease / 2) + this.params.centerAttack - (this.params.widthAttack / 2) + this.params.centerInterDur - (this.params.widthInterDur / 2);
    const maxRA = this.params.centerRelease + (this.params.widthRelease / 2) + this.params.centerAttack + (this.params.widthAttack / 2) + this.params.centerInterDur + (this.params.widthInterDur / 2);

		return html`
		<div>
		<sc-button
          value="Read"
          @input=${async () => {
            const dirHandle = await window.showDirectoryPicker();
            loadGroupDirectory(dirHandle, (enveloppes, params) => {
              this.mainSchema.set({enveloppes: enveloppes});
              updateSchema(this.mainSchema, 'params', params);
              // this.requestUpdate();
            });
          }}
        ></sc-button>
        <sc-transport
          .buttons=${['start', 'stop']}
          value=${this.mainSchema.get('state')}
          @change=${async e => {
            this.mainSchema.set('state', e.detail.value);
          }}
        ></sc-transport>
        <sc-text value="${Object.keys(this.mainSchema.get('enveloppes')).length} enveloppes loaded"></sc-text>
        </div>
        <div>
          <sc-text value="moyenne sync time"></sc-text>
          <sc-text value="amplitude sync time"></sc-text>
          <sc-text value="moyenne release"></sc-text>
          <sc-text value="amplitude release"></sc-text>
          <sc-text value="moyenne attack"></sc-text>
          <sc-text value="amplitude attack"></sc-text>
    	</div>
        <div>
          <sc-number
            min=0
            value=${this.params.centerSyncTime}
            @input=${e => { this.params.centerSyncTime = e.detail.value; this.updateMainSchema()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.widthSyncTime}
            @input=${e => { this.params.widthSyncTime = e.detail.value; this.updateMainSchema()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.centerRelease}
            @input=${e => { this.params.centerRelease = e.detail.value; this.updateMainSchema()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.widthRelease}
            @input=${e => { this.params.widthRelease = e.detail.value; this.updateMainSchema()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.centerAttack}
            @input=${e => { this.params.centerAttack = e.detail.value; this.updateMainSchema()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.widthAttack}
            @input=${e => { this.params.widthAttack = e.detail.value; this.updateMainSchema()}}
          ></sc-number>
        </div>
        <div>
          <sc-text value="moyenne silence"></sc-text>
          <sc-text value="amplitude silence"></sc-text>
          <sc-text value="current corpus"></sc-text>
          <sc-text value="time until next sync"></sc-text>
          <sc-text value="min RA"></sc-text>
          <sc-text value="max RA"></sc-text>
          <sc-text value="volume"></sc-text>
        </div>
        <div>
          <sc-number
            min=0
            value=${this.params.centerInterDur}
            @input=${e => { this.params.centerInterDur = e.detail.value; this.updateMainSchema()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.widthInterDur}
            @input=${e => { this.params.widthInterDur = e.detail.value; this.updateMainSchema()}}
          ></sc-number>
          <sc-text value="${this.currentSchema.get('corpus')}"></sc-text>
          <sc-text value=${this.currentSchema.get('nextSyncTime').toFixed(1)}></sc-text>
          <sc-text value=${minRA}></sc-text>
          <sc-text value=${maxRA}></sc-text>
          <sc-number
            value="${this.currentSchema.get('volume')}"
            min=0
            max=4
            @change=${e => { this.currentSchema.set({volume: e.detail.value}) }}
          ></sc-number>
        </div>
        <div class="separator"></div>
        <div>
        ${this.indivCollection.map(state  => { 
          return html`
            <individual-distdiv
              .state=${state}
            ></individual-distdiv>
        `})}
        </div>
	`;
	}
}



//
customElements.define('main-distdiv', MainDivDistributed);