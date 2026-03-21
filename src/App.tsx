import { useState } from 'react';
import { ToolBar } from './components/ToolBar';
import { CanaryBird } from './components/CanaryBird';
import { Specter } from './tools/Specter';
import { Snitch } from './tools/Snitch';
import { RenderTrap } from './tools/RenderTrap';
import { StorageMap } from './tools/StorageMap';
import type { ToolId } from './components/ToolBar';
import './index.css';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('specter');

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__text">
          <h1 className="app-title">Canary<span className="app-title__cursor">_</span></h1>
          <p className="app-subtitle">What does your browser expose to every site you visit?</p>
        </div>
        <CanaryBird size={160} />
      </header>

      <ToolBar active={activeTool} onChange={setActiveTool} />

      {activeTool === 'specter'    && <Specter />}
      {activeTool === 'snitch'     && <Snitch />}
      {activeTool === 'rendertrap' && <RenderTrap />}
      {activeTool === 'storagemap' && <StorageMap />}

      <footer className="app-footer">
        runs entirely in your browser · zero requests to external servers
      </footer>
    </div>
  );
}
