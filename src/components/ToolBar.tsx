export type ToolId = 'langhost' | '127.0.0.1' | 'rendertrap' | 'storagemap';

interface Tool {
  id: ToolId;
  label: string;
  available: boolean;
}

const TOOLS: Tool[] = [
  { id: 'langhost',   label: 'LAN Ghost',   available: true },
  { id: '127.0.0.1',  label: '127.0.0.1',   available: true },
  { id: 'rendertrap', label: 'RenderTrap',   available: true },
  { id: 'storagemap', label: 'StorageMap',   available: true },
];

interface ToolBarProps {
  active: ToolId;
  onChange: (id: ToolId) => void;
}

export function ToolBar({ active, onChange }: ToolBarProps) {
  return (
    <div className="toolbar">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          className={`toolbar__tool ${active === tool.id ? 'toolbar__tool--active' : ''} ${!tool.available ? 'toolbar__tool--locked' : ''}`}
          onClick={() => tool.available && onChange(tool.id)}
          title={tool.available ? undefined : 'coming soon'}
        >
          {!tool.available && <span className="toolbar__tool-prefix">+</span>}
          {tool.label}
        </button>
      ))}
    </div>
  );
}
