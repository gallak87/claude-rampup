interface ScanButtonProps {
  scanning: boolean;
  hasResults: boolean;
  onScan: () => void;
  onReset: () => void;
}

export function ScanButton({ scanning, hasResults, onScan, onReset }: ScanButtonProps) {
  return (
    <div className="scan-controls">
      <button
        className={`scan-btn ${scanning ? 'scan-btn--scanning' : ''}`}
        onClick={onScan}
        disabled={scanning}
      >
        <span className="scan-btn__prompt">{'>'}</span>
        {scanning ? ' scanning…' : ' RUN SCAN'}
      </button>
      {hasResults && !scanning && (
        <button className="reset-btn" onClick={onReset}>
          reset
        </button>
      )}
    </div>
  );
}
