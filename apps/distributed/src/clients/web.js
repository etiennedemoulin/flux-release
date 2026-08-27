import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

import '../components/MainDivDistributed.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);

  launcher.register(client, { initScreensContainer: $container });

  await client.start();

  const mainSchema = await client.stateManager.attach('main'); 
  const currentSchema = await client.stateManager.attach('current');
  const indivCollection = await client.stateManager.getCollection('indiv'); 
  // console.log('global shared state', mainSchema.getValues()); 

  mainSchema.onUpdate(updates => { 
    // console.log(updates); 
  }); 

  function renderApp() {
    render(html`
      <div class="simple-layout">
      <p>full web client</p>
      <main-distdiv 
        .mainSchema=${mainSchema} 
        .currentSchema=${currentSchema}
        .indivCollection=${indivCollection}
      ></main-distdiv>
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
