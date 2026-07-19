import type { FigureSpec } from '../../lib/engine/types';
import { exteriorLabelPoint, triangleVertices } from '../../lib/geom/layout';

export function FigureView({ figure }: { figure: FigureSpec }) {
  if (figure.kind === 'triangle-angles') {
    return <TriangleAnglesFigure figure={figure} />;
  }
  if (figure.kind === 'linear-pair') {
    return <LinearPairFigure figure={figure} />;
  }
  return null;
}

function TriangleAnglesFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'triangle-angles' }>;
}) {
  const { A, B, C } = triangleVertices(
    figure.measures.A,
    figure.measures.B,
    figure.measures.C,
  );
  const labA = exteriorLabelPoint(A, B, C);
  const labB = exteriorLabelPoint(B, A, C);
  const labC = exteriorLabelPoint(C, A, B);
  const poly = `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`;

  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox="0 0 220 220"
        width="220"
        height="220"
        role="img"
        aria-label={`Triangle with angles ${figure.labels.A}, ${figure.labels.B}, ${figure.labels.C}`}
      >
        <polygon
          points={poly}
          className="figure-shape"
          fill="var(--accent-soft)"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <AngleLabel x={labA.x} y={labA.y} text={figure.labels.A} hidden={figure.labels.A === '?'} />
        <AngleLabel x={labB.x} y={labB.y} text={figure.labels.B} hidden={figure.labels.B === '?'} />
        <AngleLabel x={labC.x} y={labC.y} text={figure.labels.C} hidden={figure.labels.C === '?'} />
        <text x={A.x} y={A.y - 8} className="figure-vertex" textAnchor="middle">
          A
        </text>
        <text x={B.x} y={B.y + 16} className="figure-vertex" textAnchor="middle">
          B
        </text>
        <text x={C.x} y={C.y + 16} className="figure-vertex" textAnchor="middle">
          C
        </text>
      </svg>
    </div>
  );
}

function LinearPairFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'linear-pair' }>;
}) {
  // Straight line through O; ray splits left/right angles
  const O = { x: 110, y: 120 };
  const leftEnd = { x: 24, y: 120 };
  const rightEnd = { x: 196, y: 120 };
  // ray angle from positive x: leftDeg is interior above line on left side
  const rayRad = (Math.PI * figure.leftDeg) / 180;
  const rayLen = 90;
  const ray = {
    x: O.x + rayLen * Math.cos(Math.PI - rayRad),
    y: O.y - rayLen * Math.sin(Math.PI - rayRad),
  };

  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox="0 0 220 180"
        width="220"
        height="180"
        role="img"
        aria-label={`Linear pair ${figure.leftLabel} and ${figure.rightLabel}`}
      >
        <line
          x1={leftEnd.x}
          y1={leftEnd.y}
          x2={rightEnd.x}
          y2={rightEnd.y}
          className="figure-line"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <line
          x1={O.x}
          y1={O.y}
          x2={ray.x}
          y2={ray.y}
          className="figure-line"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <circle cx={O.x} cy={O.y} r="3.5" fill="var(--accent)" />
        <AngleLabel
          x={O.x - 40}
          y={O.y - 28}
          text={figure.leftLabel}
          hidden={figure.leftLabel === '?'}
        />
        <AngleLabel
          x={O.x + 40}
          y={O.y - 28}
          text={figure.rightLabel}
          hidden={figure.rightLabel === '?'}
        />
      </svg>
    </div>
  );
}

function AngleLabel({
  x,
  y,
  text,
  hidden,
}: {
  x: number;
  y: number;
  text: string;
  hidden: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      className={hidden ? 'figure-label blank-label' : 'figure-label'}
    >
      {text === '?' ? '?' : `${text}°`}
    </text>
  );
}
