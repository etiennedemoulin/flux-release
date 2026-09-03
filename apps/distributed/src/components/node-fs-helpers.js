import fs from 'node:fs';
import * as path from 'path';

export function loadGroupDirectory(filePath, response) {
  const enveloppes = {};
  let params;

  if (fs.existsSync(filePath)) {
    fs.readdir(filePath, { withFileTypes: true }, (err, res1) => {
      res1.forEach(entry1 => {
        if (entry1.isDirectory()) {
          enveloppes[entry1.name] = {};
          fs.readdir(`${entry1.path}/${entry1.name}`, {withFileTypes:true}, (err, res2) => {
            res2.forEach(entry2 => {
              if (entry2.isDirectory()) {
                enveloppes[entry1.name][entry2.name] = {};
                fs.readdir(`${entry2.path}/${entry2.name}`, {withFileTypes:true}, (err, res3) => {
                  res3.forEach(entry3 => {
                    if (entry3.isFile()) {
                      if (entry3.name !== '.DS_Store') {
                        fs.readFile(`${entry3.path}/${entry3.name}`, 'utf-8', (err, data) => {
                          const content = JSON.parse(data);
                          enveloppes[entry1.name][entry2.name][entry3.name] = JSON.parse(data);
                        });
                      }
                    }
                  })
                })
              }
            })
          })
        } else {
          if (entry1.name === 'config.json') {
            fs.readFile(`${entry1.path}/${entry1.name}`, 'utf-8', (err, data) => {
              params = JSON.parse(data);
            })
          }
        }
      })
    });
  }
  setTimeout(() => {
    response(enveloppes, params);
  }, 1000)
}

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