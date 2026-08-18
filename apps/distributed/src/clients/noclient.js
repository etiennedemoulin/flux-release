import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';
import '@ircam/sc-components';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);

  // Eventually register plugins
  // client.pluginManager.register('my-plugin', plugin);

  // cf. https://soundworks.dev/tools/helpers.html#browserlauncher
  launcher.register(client, { initScreensContainer: $container });

  await client.start();

  const mainSchema = await client.stateManager.attach('main-state'); 
  console.log('global shared state', mainSchema.getValues()); 

  mainSchema.onUpdate(updates => { 
    console.log(updates); 
  }); 

  async function loadDirectory() {

    let enveloppes = {};
    let params = {};

    const dirHandle1 = await window.showDirectoryPicker();
    for await (const entry1 of dirHandle1.values()) {

      if (entry1.kind === "directory") {

        enveloppes[entry1.name] = {};

        const dirHandle2 = await dirHandle1.getDirectoryHandle(entry1.name);

        for await (const entry2 of dirHandle2.values()) {

          if (entry2.kind === "directory") {

            enveloppes[entry1.name][entry2.name] = {};

            const dirHandle3 = await dirHandle2.getDirectoryHandle(entry2.name);

            for await (const entry3 of dirHandle3.values()) {

              if (entry3.kind === 'file' && entry3.name !== '.DS_Store') {

                const fileHandle = await dirHandle3.getFileHandle(entry3.name);
                const file = await fileHandle.getFile();
                const contents = await file.text();
                enveloppes[entry1.name][entry2.name][entry3.name] = JSON.parse(contents);
              }
            } 
          }
        }
      } else {
        if (entry1.name === 'config.json') {
          const fileHandle = await dirHandle1.getFileHandle(entry1.name);
          const file = await fileHandle.getFile();
          const contents = await file.text();
          params = JSON.parse(contents);
        }
      }
    };

    mainSchema.set({enveloppes: enveloppes});
    if (Object.keys(params).length > 0) {
      mainSchema.set({params: params});
    }
  }

  function renderApp() {
    render(html`
      <div class="simple-layout">
        <p>Hello ${client.config.app.name}!</p>
        <sc-button
          value="Read"
          @input=${loadDirectory}
        ></sc-button>
        <sc-transport
          .buttons=${['start', 'stop']}
          value=${mainSchema.get('state')}
          @change=${async e => {
            mainSchema.set('state', e.detail.value);
          }}
        ></sc-transport>
        <sw-credits .infos="${client.config.app}"></sw-credits>
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
