import fs from 'node:fs';

// node
export function createReadWatchFile(filePath, response) {
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

export function createReadFile(filePath, response) {
  // if file exist
  if (fs.existsSync(filePath)) {
    // read file
    fs.readFile(filePath, (err, data) => {
      const content = JSON.parse(data);
      // callback
      response(content);
    })
  } else {
    // if file do not exists
    const content = {}
    fs.writeFile(filePath, JSON.stringify(content), (err) => {
      // write blank file
      response(content);       
    });      
  }
}