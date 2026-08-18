import '@soundworks/helpers/polyfills.js';
import '@soundworks/helpers/catch-unhandled-errors.js';
import { Server } from '@soundworks/core/server.js';
import { loadConfig, configureHttpRouter } from '@soundworks/helpers/server.js';

import ServerPluginPlatformInit from '@soundworks/plugin-platform-init/server.js'; 

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
  params: { type: "any", nullable: true, default: null }
};

server.stateManager.defineClass('main-state', mainSchema);

const mainState = await server.stateManager.create('main-state');