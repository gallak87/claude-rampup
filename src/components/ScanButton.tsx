interface ScanButtonProps {
  scanning: boolean;
  hasResults: boolean;
  onScan: () => void;
  onReset: () => void;
  active?: boolean;
  label?: string;
  scanningLabel?: string;
}

export function ScanButton({ scanning, hasResults, onScan, onReset, active, label = 'RUN SCAN', scanningLabel = 'scanning…' }: ScanButtonProps) {
  return (
    <div className="scan-controls">
      <button
        className={`scan-btn ${(scanning || active) ? 'scan-btn--scanning' : ''}`}
        onClick={onScan}
        disabled={scanning}
      >
        <span className="scan-btn__prompt">{'>'}</span>
        {scanning ? ` ${scanningLabel}` : ` ${label}`}
      </button>
      {hasResults && !scanning && (
        <button className="reset-btn" onClick={onReset}>
          reset
        </button>
      )}
    </div>
  );
}
