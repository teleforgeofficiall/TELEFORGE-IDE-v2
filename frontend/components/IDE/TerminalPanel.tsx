'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function TerminalPanel({ socket }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: '#0f0f1a',
        foreground: '#d4d4d4',
        cursor: '#ec4899',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#f44336',
        green: '#4caf50',
        yellow: '#ffeb3b',
        blue: '#2196f3',
        magenta: '#e91e63',
        cyan: '#00bcd4',
        white: '#d4d4d4',
        brightBlack: '#666666',
        brightRed: '#f44336',
        brightGreen: '#4caf50',
        brightYellow: '#ffeb3b',
        brightBlue: '#2196f3',
        brightMagenta: '#e91e63',
        brightCyan: '#00bcd4',
        brightWhite: '#ffffff',
      },
      allowTransparency: true,
      cols: 80,
      rows: 15,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddonRef.current = fitAddon;

    setTimeout(() => {
      fitAddon.fit();
    }, 100);

    term.write('Welcome to FreeCode AI Terminal\r\n');
    term.write('$ ');

    term.onData((data) => {
      if (socket) {
        socket.emit('terminal:input', data);
      }
    });

    if (socket) {
      socket.on('terminal:data', (data) => {
        term.write(data);
      });
    }

    termRef.current = term;

    const handleResize = () => {
      try { fitAddon.fit(); } catch (e) {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      termRef.current = null;
    };
  }, [socket]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: '#0f0f1a' }}
    />
  );
}
