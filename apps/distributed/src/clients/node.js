import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/node.js';

import { AudioContext } from 'node-web-audio-api'; 
import { Scheduler, Transport } from '@ircam/sc-scheduling';
import { getTime } from '@ircam/sc-gettime';

import { AppScheduler } from '../components/AppScheduler.js';

import { readWatchFile } from '../components/helpers.js';
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

  const app = new AppScheduler(audioContext, transport);

  const mainState = await client.stateManager.attach('main-state'); 

  const enveloppePath = "./appdata/enveloppes.json";
  const configPath = "./appdata/config.json";

  fs.mkdir('./appdata', (err) => {
    // console.log(err)
    readWatchFile(enveloppePath, (content) => {
      app.updateEnveloppes(content);
    });

    readWatchFile(configPath, (content) => {
      app.updateParams(content);
    })
  })

  mainState.onUpdate(updates => { 
    if ('state' in updates) {
      app.transport[updates.state]();
    };

    if ('enveloppes' in updates) {
      fs.writeFile(enveloppePath, JSON.stringify(updates.enveloppes), (err) => {});
    };

    if ('params' in updates) {
      fs.writeFile(configPath, JSON.stringify(updates.params), (err) => {});
    }
  }); 

  console.log(`Hello ${client.config.app.name}!`);
}

// The launcher allows to launch multiple clients in the same terminal window
// e.g. `EMULATE=10 npm run watch thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
