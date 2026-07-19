import type { InsertToken } from '../../lib/engine/inserts';

export function AnswerInsertBar({
  tokens,
  disabled,
  onInsert,
}: {
  tokens: InsertToken[];
  disabled?: boolean;
  onInsert: (token: string) => void;
}) {
  if (tokens.length === 0) return null;
  return (
    <div
      className="insert-bar"
      role="toolbar"
      aria-label="Insert symbols"
      data-testid="insert-bar"
    >
      <span className="insert-bar-label">Insert</span>
      {tokens.map((t) => (
        <button
          key={t.label + t.insert}
          type="button"
          className="insert-chip"
          title={t.title ?? t.label}
          disabled={disabled}
          tabIndex={-1}
          onMouseDown={(e) => {
            // keep focus / selection on the answer input
            e.preventDefault();
          }}
          onClick={() => onInsert(t.insert)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
