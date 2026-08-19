import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/node.js';

import { AudioContext } from 'node-web-audio-api'; 
import { Scheduler, Transport } from '@ircam/sc-scheduling';
import { getTime } from '@ircam/sc-gettime';

import { AppScheduler } from '../components/AppScheduler.js';

import fs from 'node:fs';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function bootstrap() {
  const config = loadConfig(process.env.ENV, import.meta.url);
  const client = new Client(config);

  // Eventually register plugins
  // client.pluginManager.register('my-plugin', plugin);

  // https://soundworks.dev/tools/helpers.html#nodelauncher
  launcher.register(client);

  await client.start();

  // create AC
  const audioContext = new AudioContext();

  // create transport
  const scheduler = new Scheduler(getTime);
  const transport = new Transport(scheduler);


  const mainState = await client.stateManager.attach('main'); 
  const currentState = await client.stateManager.attach('current');
  const indivCollection = [];
  const app = new AppScheduler(audioContext, transport, mainState.getValues().params);
  app.updateEnveloppes(mainState.getValues().enveloppes);
  mainState.set({ state: 'stop' });

  for (let i = 0; i < app.numChannels; i++) {
    indivCollection[i] = await client.stateManager.create('indiv', { 
      id: i, 
    });
  } 

  // updates on app sync on shared state
  app.onUpdate((updates) => {
    if ('corpus' in updates) {
      currentState.set({corpus: updates.corpus});
    }

    if ('nextSyncTime' in updates) {
      currentState.set({nextSyncTime: updates.nextSyncTime});
    }

    if ('enveloppeName' in updates) {
      indivCollection[updates.id].set({name: updates.enveloppeName})
    }

    if ('attackTime' in updates) {
      indivCollection[updates.id].set({attack: updates.attackTime})
    }

    if ('releaseTime' in updates) {
      indivCollection[updates.id].set({release: updates.releaseTime})
    }

    if ('silenceTime' in updates) {
      indivCollection[updates.id].set({silence: updates.silenceTime})
    }

  })

  // update on shared state sync on app
  mainState.onUpdate(updates => { 
    if ('state' in updates) {
      app.transport[updates.state]();
    };

    if ('params' in updates) {
      app.updateParams(updates.params);
    };

    if ('enveloppes' in updates) {
      app.updateEnveloppes(updates.enveloppes);
    }
  }); 

  currentState.onUpdate(updates => {
    if ('volume' in updates) {
      app.updateVolume(updates.volume);
    }
  })

  console.log(`Hello ${client.config.app.name}!`);
}

// The launcher allows to launch multiple clients in the same terminal window
// e.g. `EMULATE=10 npm run watch thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
