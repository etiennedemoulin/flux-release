import {LitElement, html, css, nothing} from 'lit';

import { TransportEvent } from '@ircam/sc-scheduling';

import '@ircam/sc-components';
import './IndividualDiv.js';

import { Engine } from './Engine.js';
import { getRandomNumber } from './utils.js'

class MainDiv extends LitElement {

    static properties = {
      currentTime: { state: true }
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

    // number of audio outputs
    this.numChannels = null;

    // data structure 
    this.enveloppes = {};
    this.enveloppeList = [];

    // for directory reaching
    this.dirHandle1 = null;

    // audio
    this.audioContext = null;
    this.merger = null;

    // transport
    this.scheduler = null;
    this.transport = null;
    this.state = 'stop';

    // params of software
    this.params = {
      centerInterDur:0,
      widthInterDur:0,
      centerRelease:0.1,
      widthRelease:0,
      centerAttack:0.1,
      widthAttack:0,
      centerSyncTime:1,
      widthSyncTime:0,
      corpus:null,
      nextCorpusTime:0
    };

    this.volume = 1;

    this.engines = null;

    this.timeoutFunc = null;
    this.currentTime = 0;

    // needed for process function
    this.process = this.process.bind(this);

  }

  connectedCallback() {
    super.connectedCallback();

    this.merger = this.audioContext.createChannelMerger(this.numChannels);
    this.merger.channelInterpretation = "discrete";
    this.merger.connect(this.audioContext.destination);

    if (!this.transport.has(this.process)) {
      this.transport.add(this.process);
    }

    this.engines = new Array(this.numChannels).fill(null);

    for (let i = 0; i < this.engines.length; i++) {
      this.engines[i] = new Engine(this.audioContext);
      this.engines[i].connect(this.merger, 0, i);
    }

  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.transport.has(this.process)) {
      this.transport.remove(this.process);
    }
  }

  process(currentTime, audioTime, event) {

    // @note for later 
    // this could be an option to refactor without using forever because we are aware of event duration.

    if (event instanceof TransportEvent) {

      // update view on transport event
      setTimeout(() => {
        this.requestUpdate();
      }, (event.tickLookahead) * 1000);

      if (event.type === "start") {
          this.timeoutFunc = setInterval(() => {
            const now = this.transport.currentTime;
            this.currentTime = this.params.nextCorpusTime - this.transport.getPositionAtTime(now);
          }, 100);
      }

      if (event.type === "stop") {
        // stop all engines
        clearInterval(this.timeoutFunc);

        for (let i = 0; i < this.engines.length; i++) {
          this.engines[i].stop();
        }
      }

      return event.speed > 0 ? currentTime : Infinity;
    }

    // pick a random new corpus
    const randomInt = Math.floor(Math.random() * this.enveloppeList.length);
    const newCorpus = this.enveloppeList[randomInt];
    const localEnv = structuredClone(this.enveloppes);
    this.params.corpus = newCorpus;

    let nextCorpus = getRandomNumber(this.params.centerSyncTime, this.params.widthSyncTime);
    if (nextCorpus < 2) {
      console.log("warning, you asked for a corpus time < 2 seconds, this is illegal and was clamped");
      nextCorpus = 2;
    }
    this.params.nextCorpusTime = currentTime + nextCorpus;

    for (let i = 0; i < this.engines.length; i++) {

      if (!Object.keys(localEnv[newCorpus]).includes(`source ${i+1}`)) {
        break;
      }

      // main loop
      const engine = this.engines[i];
      
      // compute release time
      let releaseTime = getRandomNumber(this.params.centerRelease, this.params.widthRelease);
      if (releaseTime < 0.01) {
        console.log("warning, you asked for a release time < 0.01 second, this is illegal and was clamped");        
        releaseTime = 0.01;
      }

      if (engine.env.gain.value !== 0) {
        engine.triggerRelease(this.audioContext.currentTime, releaseTime);   
      }

      // change corpus
      const folder = localEnv[newCorpus][`source ${i+1}`];
      const randomEnv = Math.floor(Math.random() * Object.keys(folder).length);
      const envName = Object.keys(folder)[randomEnv];
      const currentEnveloppe = folder[envName]; 
      currentEnveloppe.name = envName;

      let attackTime = getRandomNumber(this.params.centerAttack, this.params.widthAttack);
      if (attackTime < 0.01) {
        console.log("warning, you asked for a attack time < 0.01 second, this is illegal and was clamped");   
        attackTime = 0.01;
      }

      currentEnveloppe.attack = attackTime;
      currentEnveloppe.release = releaseTime;

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

    return this.params.nextCorpusTime;

  }

  updateVolume() {
    const now = this.audioContext.currentTime;

    for (let i = 0; i < this.engines.length; i++) {
      this.engines[i].master.gain.setValueAtTime(this.engines[i].master.gain.value, now + 0.05);
      this.engines[i].master.gain.linearRampToValueAtTime(this.volume, now + 0.1);
    }
  }

  render() {
    const active = Object.keys(this.enveloppes).length !== 0;
    const minRA = this.params.centerRelease - (this.params.widthRelease / 2) + this.params.centerAttack - (this.params.widthAttack / 2) + this.params.centerInterDur - (this.params.widthInterDur / 2);
    const maxRA = this.params.centerRelease + (this.params.widthRelease / 2) + this.params.centerAttack + (this.params.widthAttack / 2) + this.params.centerInterDur + (this.params.widthInterDur / 2);

    return html`
      <div>
      <h1>${active?"":"Please select folder"}</h1>
      <sc-text class="head" value="Select enveloppes folder"></sc-text>
      <sc-button
        value="Read"
        @input=${this.loadDirectory}
      ></sc-button>
      ${active ? html`
        <sc-button
          value="Save"
          @input=${this.saveConfig}
        ></sc-button>
        <sc-transport
          .buttons=${['start', 'stop']}
          value=${this.state}
          @change=${async e => {
            this.transport[e.detail.value]();
          }}
        ></sc-transport>
      ` : nothing}
      </div>
      ${active ? html`
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
            @input=${e => { this.params.centerSyncTime = e.detail.value}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.widthSyncTime}
            @input=${e => { this.params.widthSyncTime = e.detail.value}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.centerRelease}
            @input=${e => { this.params.centerRelease = e.detail.value, this.requestUpdate()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.widthRelease}
            @input=${e => { this.params.widthRelease = e.detail.value, this.requestUpdate()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.centerAttack}
            @input=${e => { this.params.centerAttack = e.detail.value, this.requestUpdate()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.widthAttack}
            @input=${e => { this.params.widthAttack = e.detail.value, this.requestUpdate()}}
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
            @input=${e => { this.params.centerInterDur = e.detail.value; this.requestUpdate()}}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.widthInterDur}
            @input=${e => { this.params.widthInterDur = e.detail.value, this.requestUpdate()}}
          ></sc-number>
          <sc-text value="${this.params.corpus}"></sc-text>
          <sc-text value=${this.currentTime.toFixed(1)}></sc-text>
          <sc-text value=${minRA}></sc-text>
          <sc-text value=${maxRA}></sc-text>
          <sc-number
            value="${this.volume}"
            min=0
            max=4
            @change=${e => { this.volume = e.detail.value; this.updateVolume() }}
        ></sc-number>
        </div>
      ` : nothing}
      <div class="separator"></div>
      ${active ? html`
        <div>
          ${[...Array(this.numChannels).keys()].map(id => {
            return html`
              <individual-div 
                .id=${id} 
                .engine=${this.engines[id]}
                .transport=${this.transport}
              ></individual-div>
            `;
        })}
        </div>
      ` : nothing}
    `;
  }

  async saveConfig() {

    const params = structuredClone(this.params);

    delete params.corpus;
    delete params.nextCorpusTime;

    const contents = JSON.stringify(params);
    const fileHandle = await this.dirHandle1.getFileHandle("config.json", { create: true });

    // Create a FileSystemWritableFileStream to write to.
    const writable = await fileHandle.createWritable();
    // Write the contents of the file to the stream.
    await writable.write(contents);
    // Close the file and write the contents to disk.
    await writable.close();
  }

  async loadDirectory() {

    this.dirHandle1 = await window.showDirectoryPicker();
    for await (const entry1 of this.dirHandle1.values()) {

      if (entry1.kind === "directory") {

        this.enveloppes[entry1.name] = {};

        const dirHandle2 = await this.dirHandle1.getDirectoryHandle(entry1.name);

        for await (const entry2 of dirHandle2.values()) {

          if (entry2.kind === "directory") {

            this.enveloppes[entry1.name][entry2.name] = {};

            const dirHandle3 = await dirHandle2.getDirectoryHandle(entry2.name);

            for await (const entry3 of dirHandle3.values()) {

              if (entry3.kind === 'file' && entry3.name !== '.DS_Store') {

                const fileHandle = await dirHandle3.getFileHandle(entry3.name);
                const file = await fileHandle.getFile();
                const contents = await file.text();
                this.enveloppes[entry1.name][entry2.name][entry3.name] = JSON.parse(contents);
              }
            } 
          }
        }
      } else {
        if (entry1.name === 'config.json') {
          const fileHandle = await this.dirHandle1.getFileHandle(entry1.name);
          const file = await fileHandle.getFile();
          const contents = await file.text();
          this.params = JSON.parse(contents);
        }
      }
    };

    if (Object.keys(this.enveloppes).length > 0) {
      this.enveloppeList = Object.keys(this.enveloppes);
      this.params.corpus = Object.keys(this.enveloppes)[0];
    }

    this.requestUpdate();

  }
}
customElements.define('main-div', MainDiv);

