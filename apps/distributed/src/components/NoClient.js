import { LitElement, html, css } from 'lit';
import '@ircam/sc-components';
		
export class noclient extends LitElement {
	static properties = {
		localTime: { state: true }
	};

	static styles = css`
	sc-text {
	    width: 140px;
	    margin: 4px;
	}

	sc-toggle {
	    width: 500px;
	    height: 500px;
	    margin: 4px;
	}
	`;

	constructor() {
		super();
		this.currentSchema = null;

		this.localTimeFunction = setInterval(() => {
			const currentdate = new Date();
			this.localTime = "A World Suspended " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
		}, 1000);

	};

	render() {
		return html`
		<p>${this.localTime}</p>
		<sc-toggle
			.value=${!this.currentSchema.get('volume')}
			@change=${e => {
				if (e.detail.value === false) {
					this.currentSchema.set({volume:1})
				} else {
					this.currentSchema.set({volume:0})
				}
			}}
		></sc-toggle>


	`;
	}
}

customElements.define('no-client', noclient);