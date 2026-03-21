import { NavBar } from './NavBar';

export type ToolId = 'specter' | 'rendertrap' | 'storagemap';

const TOOLS = [
  { id: 'specter',    label: 'Specter'    },
  { id: 'rendertrap', label: 'RenderTrap' },
  { id: 'storagemap', label: 'StorageMap' },
] as const;

interface ToolBarProps {
  active: ToolId;
  onChange: (id: ToolId) => void;
}

export function ToolBar({ active, onChange }: ToolBarProps) {
  return <NavBar items={TOOLS} active={active} onChange={onChange} variant="main" />;
}
