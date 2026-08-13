import { html, render } from 'lit';

import { Scheduler, Transport } from '@ircam/sc-scheduling';
import { getTime } from '@ircam/sc-gettime';

import './MainDiv.js';

import resumeAudioContext from '../lib/resume-audio-context.js';

const audioContext = new AudioContext();
await resumeAudioContext(audioContext);

const numChannels = audioContext.destination.maxChannelCount;
audioContext.destination.channelCount = numChannels;
audioContext.destination.channelCountMode = "explicit";
audioContext.destination.channelInterpretation = 'discrete';

console.log('> Num Channels:', audioContext.destination.channelCount);

const scheduler = new Scheduler(getTime);
const transport = new Transport(scheduler);

render(html`
  <h1>flux-release</h1>
  <main-div .numChannels=${numChannels} .scheduler=${scheduler} .transport=${transport} .audioContext=${audioContext}></main-div>
`, document.body);

