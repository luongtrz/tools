interface OutputSettingsProps {
  pageSize: string;
  orientation: string;
  margins: string;
  outputName: string;
  onPageSizeChange: (value: string) => void;
  onOrientationChange: (value: string) => void;
  onMarginsChange: (value: string) => void;
  onOutputNameChange: (value: string) => void;
  command: string;
  onCopyCommand: () => void;
}

export default function OutputSettings({
  pageSize,
  orientation,
  margins,
  outputName,
  onPageSizeChange,
  onOrientationChange,
  onMarginsChange,
  onOutputNameChange,
  command,
  onCopyCommand,
}: OutputSettingsProps) {
  return (
    <div className="settings-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow small">OUTPUT SETTINGS</p>
          <h2>PDF output</h2>
        </div>
        <span className="settings-icon" aria-hidden="true">
          ⚙
        </span>
      </div>
      <div className="settings-fields">
        <label>
          Page size
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value)}
          >
            <option value="A4">A4 · 210 × 297 mm</option>
            <option value="Letter">Letter · 8.5 × 11 in</option>
            <option value="A5">A5 · 148 × 210 mm</option>
          </select>
        </label>
        <label>
          Orientation
          <select
            value={orientation}
            onChange={(event) => onOrientationChange(event.target.value)}
          >
            <option value="Portrait">Portrait</option>
            <option value="Landscape">Landscape</option>
          </select>
        </label>
        <label>
          Margins
          <select
            value={margins}
            onChange={(event) => onMarginsChange(event.target.value)}
          >
            <option value="18">Standard · 18 mm</option>
            <option value="10">Narrow · 10 mm</option>
            <option value="25">Wide · 25 mm</option>
          </select>
        </label>
        <label>
          File name
          <div className="input-with-suffix">
            <input
              value={outputName}
              onChange={(event) => onOutputNameChange(event.target.value)}
            />
            <span>.pdf</span>
          </div>
        </label>
      </div>
      <div className="command-preview">
        <div>
          <span className="terminal-dot" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
          <code>{command}</code>
        </div>
        <button type="button" onClick={onCopyCommand}>
          Copy
        </button>
      </div>
    </div>
  );
}
