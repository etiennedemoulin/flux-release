
// window
export async function loadGroupDirectory(dirHandle1, callbackFunction) {
  const enveloppes = {};
  let params;

  // const dirHandle1 = await window.showDirectoryPicker();
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

  callbackFunction(enveloppes, params);
  // return [enveloppes]

  // mainSchema.set({enveloppes: enveloppes});
  // update(mainSchema, 'params', params);


}