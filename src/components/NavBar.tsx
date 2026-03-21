interface NavItem {
  id: string;
  label: string;
}

interface NavBarProps<T extends string> {
  items: readonly NavItem[];
  active: T;
  onChange: (id: T) => void;
  variant?: 'main' | 'sub';
}

export function NavBar<T extends string>({ items, active, onChange, variant = 'main' }: NavBarProps<T>) {
  return (
    <div className={`navbar navbar--${variant}`}>
      {items.map(item => (
        <button
          key={item.id}
          className={`navbar__item${active === item.id ? ' navbar__item--active' : ''}`}
          onClick={() => onChange(item.id as T)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
