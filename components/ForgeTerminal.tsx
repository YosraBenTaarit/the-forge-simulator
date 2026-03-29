"use client";

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { getWebContainer, files } from '@/lib/webcontainer';
import 'xterm/css/xterm.css';

export default function ForgeTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let shellProcess: any;

    async function init() {
      if (!terminalRef.current) return;

      // 1. Setup Xterm
      const term = new Terminal({ 
        cursorBlink: true, 
        theme: { 
          background: '#000000',
          foreground: '#00FF41',
          cursor: '#FFFFFF',
        },
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      term.writeln('\x1b[1;33m⚒️ Booting Axiom-OS Workstation...\x1b[0m');

      // 2. Boot WebContainer
      const webcontainer = await getWebContainer();
      await webcontainer.mount(files);
      
      term.writeln('\x1b[32m✓ Virtual environment ready\x1b[0m\n');

      // 3. Start a real Bash-like shell (jsh)
      shellProcess = await webcontainer.spawn('jsh', {
        terminal: { cols: term.cols, rows: term.rows }
      });

      // 4. Pipe WebContainer output to Xterm
      shellProcess.output.pipeTo(new WritableStream({
        write(data) { term.write(data); }
      }));

      // 5. Pipe Xterm input to WebContainer
      const input = shellProcess.input.getWriter();
      let currentCommand = '';

      term.onData(async (data) => {
        input.write(data);

        // Logic to capture the command and send to AI
        if (data === '\r') { // Enter key
          if (currentCommand.trim().length > 0) {
            console.log("Sending to mentor:", currentCommand);
            
            // Dispatch loading event
            window.dispatchEvent(new CustomEvent('mentor-loading'));
            
            // Call your Mentor API
            try {
              const response = await fetch('/api/mentor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  command: currentCommand,
                  context: "User is in a real Node.js shell. They are trying to find a memory leak in ad-service/index.js."
                }),
              });
              const result = await response.json();
              
              // Dispatch the message to the sidebar
              window.dispatchEvent(new CustomEvent('mentor-message', { detail: result.text }));
            } catch (err) {
              console.error("Mentor Error:", err);
              // Dispatch error message
              window.dispatchEvent(new CustomEvent('mentor-message', { detail: "Mentor offline. Try again." }));
            }
            
            currentCommand = '';
          }
        } else {
          // Only add to command if it's not a control character
          if (data.length === 1 && data.charCodeAt(0) >= 32) {
            currentCommand += data;
          }
        }
      });
    }

    init();
    return () => shellProcess?.kill();
  }, []);

  return <div ref={terminalRef} className="h-full w-full" />;
}