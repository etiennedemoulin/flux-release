import '@soundworks/helpers/polyfills.js';
import '@soundworks/helpers/catch-unhandled-errors.js';
import { Server } from '@soundworks/core/server.js';
import { loadConfig, configureHttpRouter } from '@soundworks/helpers/server.js';

import ServerPluginPlatformInit from '@soundworks/plugin-platform-init/server.js'; 

import fs from 'node:fs'

import { createReadFile } from './components/node-fs-helpers.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = loadConfig(process.env.ENV, import.meta.url);

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${process.env.ENV || 'default'}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

const server = new Server(config);
configureHttpRouter(server);

server.pluginManager.register('platform-init', ServerPluginPlatformInit); 

// Register plugins and create shared state classes
// server.pluginManager.register('my-plugin', plugin);
// server.stateManager.defineClass('my-class', description);

await server.start();

const mainSchema = {
  state: { type: "string", nullable: false, default: 'stop' },
  enveloppes: { type: "any", nullable: true, default: null },
  params: { type: "any", nullable: true, default: null },
};

const currentSchema = {
  corpus: { type: "string", nullable: true, default: null },
  nextSyncTime: { type: "float", nullable: false, default: 0 },
  volume: { type: 'float', nullable: false, default: 1 }
}

const indivSchema = {
  id: { type: 'integer', nullable: false, default: 0 },
  name: { type: 'string', nullable: true, default: null },
  attack: { type: 'float', nullable: false, default: 0},
  release: { type: 'float', nullable: false, default: 0},
  silence: { type: 'float', nullable: false, default: 0},
  volume: { type: 'float', nullable: false, default: 0},
  frequency: { type: 'float', nullable: false, default: 0}
}

server.stateManager.defineClass('main', mainSchema);
server.stateManager.defineClass('current', currentSchema);
server.stateManager.defineClass('indiv', indivSchema);

const mainState = await server.stateManager.create('main');
const currentState = await server.stateManager.create('current');

const enveloppePath = "./appdata/enveloppes.json";
const configPath = "./appdata/config.json"; 

const defaultParams = {
      centerInterDur:0,
      widthInterDur:0,
      centerRelease:0.1,
      widthRelease:0,
      centerAttack:0.1,
      widthAttack:0,
      centerSyncTime:1,
      widthSyncTime:0
};

fs.mkdir('./appdata', (err) => {

createReadFile(enveloppePath, (content) => {
  mainState.set({enveloppes:content});
});

createReadFile(configPath, (content) => {
  if (Object.keys(content).length === 0) {
    mainState.set({params: defaultParams});
  } else {
    Object.assign(defaultParams, content);
    mainState.set({params: content});
  }
});

});

server.stateManager.registerUpdateHook('main', async (updates, currentValues) => {
  if ('enveloppes' in updates) {
    fs.writeFile(enveloppePath, JSON.stringify(updates.enveloppes), (err) => {});
  };

  if ('params' in updates) {
    fs.writeFile(configPath, JSON.stringify(updates.params), (err) => {});
  }

  return {
    ...updates
  };
  // }
});



