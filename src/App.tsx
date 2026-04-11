import { useState } from 'react';
import { Canary } from './tools/Canary';
import { Hawk } from './tools/Hawk';
import './index.css';

type AppId = 'canary' | 'hawk';

const APPS: { id: AppId; label: string }[] = [
  { id: 'canary', label: 'Canary' },
  { id: 'hawk',   label: 'Hawk'   },
];

export default function App() {
  const [activeApp, setActiveApp] = useState<AppId>('hawk');

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="sidebar__logo">◈</div>
        {APPS.map(app => (
          <button
            key={app.id}
            className={`sidebar__item${activeApp === app.id ? ' sidebar__item--active' : ''}`}
            onClick={() => setActiveApp(app.id)}
          >
            <span className="sidebar__item-label">{app.label}</span>
          </button>
        ))}
      </nav>

      <main className="shell__main">
        {activeApp === 'canary' && <Canary />}
        {activeApp === 'hawk'   && <Hawk />}
      </main>
    </div>
  );
}
