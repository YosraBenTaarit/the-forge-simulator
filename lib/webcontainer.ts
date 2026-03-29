import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer;

export async function getWebContainer() {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot();
  }
  return webcontainerInstance;
}

// These are the "Fake" files for your company simulation
export const files = {
  'axiom-corp': {
    directory: {
      'ad-service': {
        directory: {
          'index.js': {
            file: {
              contents: `
console.log("Axiom Corp Ad-Service Starting...");
const data = [];
setInterval(() => {
  // THE MEMORY LEAK: Accumulating data forever
  data.push(new Array(100000).fill('leak'));
  console.log("Memory Usage Rising...");
}, 1000);
              `,
            },
          },
          'package.json': {
            file: {
              contents: `{
  "name": "ad-service",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
            },
          },
          'CRASH_DUMP.log': {
            file: {
              contents: `[ERROR] Memory heap overflow detected
[STACK] at processData (index.js:12:5)
[CRITICAL] Process terminated due to memory constraints`,
            },
          },
        },
      },
      'src': {
        directory: {
          'main.config.js': {
            file: {
              contents: `module.exports = {
  service: "ad-service",
  port: 3000,
  memoryLimit: "512mb"
};`,
            },
          },
        },
      },
      'monitor-memory.js': {
        file: {
          contents: `#!/usr/bin/env node
// Custom "top" replacement for WebContainer
const os = require('os');
const startTime = Date.now();

console.clear();
console.log("\\x1b[2J\\x1b[0;0H"); // Clear screen
console.log("\\x1b[1;33m=== AXIOM PROCESS MONITOR (Forge Top) ===\\x1b[0m");
console.log("Press Ctrl+C to exit\\n");

setInterval(() => {
  const mem = process.memoryUsage();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  console.log("\\x1b[2J\\x1b[0;0H"); // Clear screen
  console.log("\\x1b[1;33m=== AXIOM PROCESS MONITOR ===\\x1b[0m");
  console.log("Uptime: " + uptime + "s");
  console.log("\\x1b[1;36mMemory Usage:\\x1b[0m");
  console.log("  RSS (physical):  " + (mem.rss / 1024 / 1024).toFixed(2) + " MB");
  console.log("  Heap Total:      " + (mem.heapTotal / 1024 / 1024).toFixed(2) + " MB");
  console.log("  \\x1b[1;31mHeap Used:       " + (mem.heapUsed / 1024 / 1024).toFixed(2) + " MB\\x1b[0m");
  console.log("  External:        " + (mem.external / 1024 / 1024).toFixed(2) + " MB");
  
  const heapPercent = (mem.heapUsed / mem.heapTotal * 100).toFixed(1);
  console.log("\\n  Heap Usage: [" + "=".repeat(Math.floor(heapPercent / 5)) + " ".repeat(20 - Math.floor(heapPercent / 5)) + "] " + heapPercent + "%");
  
  if (heapPercent > 80) {
    console.log("\\n  \\x1b[1;31m⚠️  WARNING: High memory usage detected! \\x1b[0m");
  }
  console.log("\\nPID: " + process.pid);
}, 500);
`,
        },
      },
      'ps.js': {
        file: {
          contents: `#!/usr/bin/env node
// Custom "ps" replacement
console.log("PID\\tPROCESS");
console.log(process.pid + "\\tnode");
console.log("\\nNote: In WebContainer, only current Node.js process is visible");
`,
        },
      },
    },
  },
};
