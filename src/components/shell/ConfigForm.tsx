import type { RelationPack } from '../../lib/engine/types';

export function ConfigForm({
  pack,
  value,
  onChange,
  idPrefix = 'cfg',
}: {
  pack: RelationPack;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  /** Avoid duplicate ids when two forms exist on one page. */
  idPrefix?: string;
}) {
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });

  return (
    <div className="config-grid">
      {pack.configSchema.map((field) => {
        const labelId = `${idPrefix}-label-${field.key}`;
        return (
          <div className="config-field" key={field.key}>
            <span className="field-label" id={labelId}>
              {field.label}
            </span>
            {field.type === 'multi-ops' && (
              <div className="chip-row" role="group" aria-labelledby={labelId}>
                {(field.options ?? []).map((opt) => {
                  const selected = Array.isArray(value[field.key])
                    ? (value[field.key] as string[]).includes(opt.value)
                    : false;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className="chip"
                      aria-pressed={selected}
                      onClick={() => {
                        const cur = Array.isArray(value[field.key])
                          ? [...(value[field.key] as string[])]
                          : [];
                        const next = selected
                          ? cur.filter((x) => x !== opt.value)
                          : [...cur, opt.value];
                        set(field.key, next.length ? next : [opt.value]);
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
            {(field.type === 'select' || field.type === 'range-select') && (
              <select
                className="select-input"
                aria-labelledby={labelId}
                value={String(value[field.key] ?? field.default)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (field.type === 'range-select' && /^\d+$/.test(v)) {
                    set(field.key, Number(v));
                  } else {
                    set(field.key, v);
                  }
                }}
              >
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {field.type === 'toggle' && (
              <div className="chip-row">
                <button
                  type="button"
                  className="chip"
                  aria-pressed={Boolean(value[field.key])}
                  aria-labelledby={labelId}
                  onClick={() => set(field.key, !value[field.key])}
                >
                  {value[field.key] ? 'On' : 'Off'}
                </button>
              </div>
            )}
            {field.help && <p className="hint-text">{field.help}</p>}
          </div>
        );
      })}
    </div>
  );
}
