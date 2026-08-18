import fs from 'node:fs';

export function readWatchFile(filePath, response) {
  // if file exist
  if (fs.existsSync(filePath)) {
    // read file
    fs.readFile(filePath, (err, data) => {
      const content = JSON.parse(data);
      // callback
      response(content);
      // watch file change
      fs.watch(filePath, (eventType, fileName) => {
        if (eventType === 'change') {
          // read file
          fs.readFile(filePath, (err, data) => {
            const content = JSON.parse(data);
            response(content);             
          })
        }
      })
    })
  } else {
    // if file do not exists
    fs.writeFile(filePath, JSON.stringify({}), (err) => {
      // write blank file
      // watch file changes
      fs.watch(filePath, (eventType, fileName) => {
        if (eventType === 'change') {
          // read file
          fs.readFile(filePath, (err, data) => {
            const content = JSON.parse(data);
            // callback
            response(content);           
          })
        }
      })        
    });      
  }
}