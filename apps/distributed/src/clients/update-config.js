import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/node.js';
import { openFileManagerDialog } from 'open-file-manager-dialog';
import * as path from 'path';
import { loadGroupDirectory } from '../components/node-fs-helpers.js';
import { updateSchema } from "../components/sw-helpers.js";

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
  const mainSchema = await client.stateManager.attach('main'); 
  const selectedPaths = await openFileManagerDialog();
  const directoryPath = path.dirname(selectedPaths.files[0]);
  // const directoryPath = "/Users/etiennedemoulin/Github/flux-release/docs/MATIERES SONORES"
  loadGroupDirectory(directoryPath, (enveloppes, params) => {
    mainSchema.set({enveloppes: enveloppes});
    updateSchema(mainSchema, 'params', params);
  });
  console.log("updated config : ");
  console.log("enveloppes : ", Object.keys(mainSchema.get('enveloppes')).length);
  console.log("params : ", mainSchema.get('params'));
}

// The launcher allows to launch multiple clients in the same terminal window
// e.g. `EMULATE=10 npm run watch thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
