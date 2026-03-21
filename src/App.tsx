import { useState } from 'react';
import { ToolBar } from './components/ToolBar';
import { LocalhostScanner } from './tools/LocalhostScanner';
import { RenderTrap } from './tools/RenderTrap';
import { StorageMap } from './tools/StorageMap';
import type { ToolId } from './components/ToolBar';
import './index.css';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('127.0.0.1');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Canary<span className="app-title__cursor">_</span></h1>
        <p className="app-subtitle">What does your browser expose to every site you visit?</p>
      </header>

      <ToolBar active={activeTool} onChange={setActiveTool} />

      {activeTool === '127.0.0.1' && <LocalhostScanner />}
      {activeTool === 'rendertrap' && <RenderTrap />}
      {activeTool === 'storagemap' && <StorageMap />}

      <footer className="app-footer">
        runs entirely in your browser · zero requests to external servers
      </footer>
    </div>
  );
}
