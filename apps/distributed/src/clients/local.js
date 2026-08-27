import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

import ClientPluginPlatformInit from '@soundworks/plugin-platform-init/client.js'; 

import { Scheduler, Transport } from '@ircam/sc-scheduling';
import { getTime } from '@ircam/sc-gettime';

import '../components/MainDiv.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);

  const audioContext = new AudioContext(); 
  const scheduler = new Scheduler(getTime);
  const transport = new Transport(scheduler);

  const numChannels = audioContext.destination.maxChannelCount;
  audioContext.destination.channelCount = numChannels;
  audioContext.destination.channelCountMode = "explicit";
  audioContext.destination.channelInterpretation = 'discrete';

  console.log('> Num Channels:', audioContext.destination.channelCount);

  client.pluginManager.register('platform-init', ClientPluginPlatformInit, { audioContext });  

  // cf. https://soundworks.dev/tools/helpers.html#browserlauncher
  launcher.register(client, { initScreensContainer: $container });

  await client.start();

  const mainState = await client.stateManager.attach('main'); 
  console.log('global shared state', mainState.getValues()); 

  mainState.onUpdate(updates => { 
    console.log(updates); 
  }); 

  function renderApp() {
    render(html`
      <div class="simple-layout">
      <main-div .numChannels=${numChannels} .transport=${transport} .audioContext=${audioContext}></main-div>
      </div>
    `, $container);
  }

  renderApp();
}

// The launcher allows to launch multiple clients in the same browser window
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate') || '') || 1,
});
