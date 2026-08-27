import { LitElement, html, css } from 'lit';
import '@ircam/sc-components';

export class IndividualDistDiv extends LitElement {
	static properties = {

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
		this.state = null;
	};

	connectedCallback() {
		super.connectedCallback();
		this.state.onUpdate(() => {
			this.requestUpdate();
		})
	}

	render() {
		return html`
			<div>
				<sc-text class="title" value="Electroaimant ${this.state.get('id') + 1}"></sc-text>
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
				<sc-text value="${this.state.get('name')}"></sc-text>
				<sc-text value="${this.state.get('volume').toFixed(2)}"></sc-text>
				<sc-text value="${this.state.get('frequency').toFixed(2)}"></sc-text>
				<sc-text value="${this.state.get('attack').toFixed(2)}"></sc-text>
				<sc-text value="${this.state.get('silence').toFixed(2)}"></sc-text>
				<sc-text value="${this.state.get('release').toFixed(2)}"></sc-text>
			</div>
			<div class="separator"></div>
	`;
	}
}

/*


*/
customElements.define('individual-distdiv', IndividualDistDiv);