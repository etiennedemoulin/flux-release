import { LitElement, html, css } from 'lit';
import '@ircam/sc-components';
		
export class noclient extends LitElement {
	static properties = {
		localTime: { state: true }
	};

	static styles = css`
	.time {
	    font-size:30px;
	}

	sc-toggle {
		background-color: #121212;
		--sc-toggle-inactive-color: #454545;
		--sc-toggle-active-color: #FFC067;
	    width: 700px;
        height: 300px;
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

	connectedCallback() {
		super.connectedCallback();
	    this.currentSchema.onUpdate(updates => {
	      this.requestUpdate();
	    });
	}

	render() {
		return html`
		<p class="time">${this.localTime}</p>
		</br>
		<p>mute</p>
		<sc-toggle
			.value=${this.currentSchema.get('volume') === 0 ? true : false}
			@change=${e => e.detail.value ? this.currentSchema.set({volume:0}) : this.currentSchema.set({volume:1})}
		></sc-toggle>


	`;
	}
}

customElements.define('no-client', noclient);
