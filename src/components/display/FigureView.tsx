import type { FigureSpec } from '../../lib/engine/types';
import {
  exteriorLabelPoint,
  triangleVertices,
  vertexLetterPoint,
  FIGURE_VIEW_SIZE,
  clampPt,
} from '../../lib/geom/layout';

export function FigureView({ figure }: { figure: FigureSpec }) {
  if (figure.kind === 'triangle-angles') {
    return <TriangleAnglesFigure figure={figure} />;
  }
  if (figure.kind === 'linear-pair') {
    return <LinearPairFigure figure={figure} />;
  }
  if (figure.kind === 'vertical-angles') {
    return <VerticalAnglesFigure figure={figure} />;
  }
  if (figure.kind === 'complementary') {
    return <ComplementaryFigure figure={figure} />;
  }
  if (figure.kind === 'exterior-angle') {
    return <ExteriorAngleFigure figure={figure} />;
  }
  if (figure.kind === 'parallel-transversal') {
    return <ParallelTransversalFigure figure={figure} />;
  }
  if (figure.kind === 'circle-rd') {
    return <CircleRdFigure figure={figure} />;
  }
  if (figure.kind === 'line-2d') {
    return <Line2dFigure figure={figure} />;
  }
  if (figure.kind === 'unit-circle') {
    return <UnitCircleFigure figure={figure} />;
  }
  if (figure.kind === 'right-triangle') {
    return <RightTriangleFigure figure={figure} />;
  }
  return null;
}

function UnitCircleFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'unit-circle' }>;
}) {
  const W = 240;
  const H = 240;
  const cx = 120;
  const cy = 120;
  const R = 85;
  // 0° at +x, CCW; SVG y increases down
  const px = cx + R * Math.cos((figure.deg * Math.PI) / 180);
  const py = cy - R * Math.sin((figure.deg * Math.PI) / 180);
  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label={`Unit circle at ${figure.deg}° for ${figure.fn}`}
      >
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="var(--accent-soft)"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <line x1={cx - R - 10} y1={cy} x2={cx + R + 10} y2={cy} stroke="var(--border-strong)" strokeWidth="1" />
        <line x1={cx} y1={cy - R - 10} x2={cx} y2={cy + R + 10} stroke="var(--border-strong)" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={px} y2={py} stroke="var(--warn)" strokeWidth="2" />
        <circle cx={px} cy={py} r="5" fill="var(--warn)" />
        <text x={px + 10} y={py - 8} className="figure-vertex">
          {figure.deg}°
        </text>
        <text x={cx + R + 4} y={cy - 6} className="figure-vertex">
          1
        </text>
      </svg>
      <p className="figure-caption">
        {figure.fn}({figure.deg}°) on the unit circle
      </p>
    </div>
  );
}

function RightTriangleFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'right-triangle' }>;
}) {
  const W = 280;
  const H = 220;
  // Place right angle at origin-ish bottom-left
  const O = { x: 40, y: 180 };
  // Scale legs into box
  const maxLeg = Math.max(figure.adj, figure.opp, 1);
  const scale = 130 / maxLeg;
  const Ax = O.x + figure.adj * scale;
  const Ay = O.y;
  const Bx = O.x;
  const By = O.y - figure.opp * scale;
  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label="Right triangle"
      >
        <polygon
          points={`${O.x},${O.y} ${Ax},${Ay} ${Bx},${By}`}
          fill="var(--accent-soft)"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        {/* right-angle mark */}
        <path
          d={`M ${O.x + 14} ${O.y} L ${O.x + 14} ${O.y - 14} L ${O.x} ${O.y - 14}`}
          fill="none"
          stroke="var(--fg-mute)"
          strokeWidth="1.5"
        />
        <text x={(O.x + Ax) / 2} y={O.y + 18} className="figure-vertex" textAnchor="middle">
          adj
        </text>
        <text x={O.x - 18} y={(O.y + By) / 2} className="figure-vertex" textAnchor="middle">
          opp
        </text>
        <text
          x={(Ax + Bx) / 2 + 12}
          y={(Ay + By) / 2}
          className="figure-vertex"
        >
          hyp
        </text>
        <text
          x={O.x + 36}
          y={O.y - 28}
          className="figure-angle-letter"
          textAnchor="middle"
        >
          {figure.hideTheta ? 'θ=?' : `θ=${Math.round(figure.thetaDeg)}°`}
        </text>
      </svg>
    </div>
  );
}

function ParallelTransversalFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'parallel-transversal' }>;
}) {
  /**
   *   A = top-left interior   B = top-right interior
   *   C = bottom-left interior D = bottom-right interior
   *
   * Labels placed along the angle bisector of each interior wedge so they
   * cannot sit on the transversal (screenshot-verified layout).
   */
  const W = 340;
  const H = 300;
  const yTop = 90;
  const yBot = 220;
  // Steeper visual but still clear; long parallels
  const t1 = { x: 95, y: 35 };
  const t2 = { x: 245, y: 275 };
  const ixAt = (y: number) => {
    const t = (y - t1.y) / (t2.y - t1.y);
    return t1.x + t * (t2.x - t1.x);
  };
  const ixTop = ixAt(yTop);
  const ixBot = ixAt(yBot);

  // Transversal unit direction (down-right) and left/right normals
  const tdx = t2.x - t1.x;
  const tdy = t2.y - t1.y;
  const tlen = Math.hypot(tdx, tdy) || 1;
  const ux = tdx / tlen;
  const uy = tdy / tlen;
  // rotate 90° CCW = "left" when traveling along transversal
  const leftX = -uy;
  const leftY = ux;
  const rightX = uy;
  const rightY = -ux;

  const unit = (x: number, y: number) => {
    const L = Math.hypot(x, y) || 1;
    return { x: x / L, y: y / L };
  };
  const place = (
    ix: number,
    iy: number,
    side: 'left' | 'right',
    towardInterior: 'down' | 'up',
    dist: number,
  ) => {
    const sx = side === 'left' ? leftX : rightX;
    const sy = side === 'left' ? leftY : rightY;
    const iyDir = towardInterior === 'down' ? 1 : -1;
    // bisect side-of-transversal with vertical into the interior band
    const b = unit(sx + 0, sy + iyDir * 1.15);
    return { x: ix + b.x * dist, y: iy + b.y * dist };
  };

  // Prefer pure horizontal offsets inside the band when the bisector
  // would pull labels toward the transversal — lock y into the band mid-thirds.
  const bandLo = yTop + 28;
  const bandHi = yBot - 28;
  const clampBand = (p: { x: number; y: number }, prefer: 'top' | 'bot') => ({
    x: Math.min(W - 36, Math.max(36, p.x)),
    y:
      prefer === 'top'
        ? Math.min(yTop + 70, Math.max(bandLo, p.y))
        : Math.max(yBot - 70, Math.min(bandHi, p.y)),
  });

  const posA = clampBand(place(ixTop, yTop, 'left', 'down', 62), 'top');
  const posB = clampBand(place(ixTop, yTop, 'right', 'down', 62), 'top');
  const posC = clampBand(place(ixBot, yBot, 'left', 'up', 62), 'bot');
  const posD = clampBand(place(ixBot, yBot, 'right', 'up', 62), 'bot');

  // Force A/B onto the upper third and C/D onto the lower third so they never meet
  posA.y = yTop + 42;
  posB.y = yTop + 42;
  posC.y = yBot - 42;
  posD.y = yBot - 42;
  // Horizontal: clear of transversal (min 50px away from ix at that y)
  const away = (ix: number, x: number, side: 'left' | 'right') => {
    if (side === 'left') return Math.min(x, ix - 52);
    return Math.max(x, ix + 52);
  };
  posA.x = away(ixTop, posA.x, 'left');
  posB.x = away(ixTop, posB.x, 'right');
  posC.x = away(ixBot, posC.x, 'left');
  posD.x = away(ixBot, posD.x, 'right');

  const leader = (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    return (
      <line
        x1={from.x + (dx / len) * 10}
        y1={from.y + (dy / len) * 10}
        x2={to.x - (dx / len) * 24}
        y2={to.y - (dy / len) * 24}
        stroke="var(--fg-mute)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
    );
  };

  const named = (
    pos: { x: number; y: number },
    from: { x: number; y: number },
    letter: string,
    measure: string,
  ) => (
    <g>
      {leader(from, pos)}
      <text
        x={pos.x}
        y={pos.y - 16}
        className="figure-angle-letter"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ∠{letter}
      </text>
      <AngleLabel
        x={pos.x}
        y={pos.y + 4}
        text={measure}
        hidden={measure === '?'}
      />
    </g>
  );

  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label="Parallel lines cut by a transversal; ∠A ∠B top interiors, ∠C ∠D bottom interiors"
      >
        <rect
          x={18}
          y={yTop}
          width={W - 36}
          height={yBot - yTop}
          fill="var(--accent-soft)"
          opacity={0.3}
        />
        <line
          x1={18}
          y1={yTop}
          x2={W - 18}
          y2={yTop}
          stroke="var(--accent)"
          strokeWidth="2.5"
        />
        <line
          x1={18}
          y1={yBot}
          x2={W - 18}
          y2={yBot}
          stroke="var(--accent)"
          strokeWidth="2.5"
        />
        <line
          x1={t1.x}
          y1={t1.y}
          x2={t2.x}
          y2={t2.y}
          stroke="var(--accent)"
          strokeWidth="2.5"
        />
        <circle cx={ixTop} cy={yTop} r="4" fill="var(--accent)" />
        <circle cx={ixBot} cy={yBot} r="4" fill="var(--accent)" />
        <text x={W - 34} y={yTop - 10} className="figure-vertex">
          ∥
        </text>
        <text x={W - 34} y={yBot - 10} className="figure-vertex">
          ∥
        </text>
        {named(posA, { x: ixTop, y: yTop }, 'A', figure.labels.A)}
        {named(posB, { x: ixTop, y: yTop }, 'B', figure.labels.B)}
        {named(posC, { x: ixBot, y: yBot }, 'C', figure.labels.C)}
        {named(posD, { x: ixBot, y: yBot }, 'D', figure.labels.D)}
      </svg>
      <p className="figure-caption">
        Shaded = between the parallels. Upper intersection: ∠A left, ∠B right.
        Lower: ∠C left, ∠D right.
      </p>
    </div>
  );
}

function CircleRdFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'circle-rd' }>;
}) {
  const W = 220;
  const H = 200;
  const cx = 110;
  const cy = 100;
  const R = 70;
  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label="Circle with radius and diameter"
      >
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="var(--accent-soft)"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        {figure.showD && (
          <line
            x1={cx - R}
            y1={cy}
            x2={cx + R}
            y2={cy}
            stroke="var(--fg-dim)"
            strokeWidth="1.5"
          />
        )}
        <line
          x1={cx}
          y1={cy}
          x2={cx + R}
          y2={cy}
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <circle cx={cx} cy={cy} r="3" fill="var(--accent)" />
        <AngleLabel
          x={cx + R / 2}
          y={cy - 16}
          text={figure.rLabel}
          hidden={figure.rLabel === '?'}
          unit=""
          prefix="r="
        />
        {figure.showD && (
          <AngleLabel
            x={cx}
            y={cy + 28}
            text={figure.dLabel}
            hidden={figure.dLabel === '?'}
            unit=""
            prefix="d="
          />
        )}
      </svg>
    </div>
  );
}

function Line2dFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'line-2d' }>;
}) {
  const W = 240;
  const H = 240;
  const xMin = figure.xMin ?? -8;
  const xMax = figure.xMax ?? 8;
  const yMin = figure.yMin ?? -8;
  const yMax = figure.yMax ?? 8;
  const pad = 24;
  const toX = (x: number) =>
    pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
  const toY = (y: number) =>
    H - pad - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad);
  const ox = toX(0);
  const oy = toY(0);

  const lineSeg = (m: number, b: number) => {
    // clip line to view box in data coords
    const yAt = (x: number) => m * x + b;
    const x1 = xMin;
    const x2 = xMax;
    return {
      x1: toX(x1),
      y1: toY(yAt(x1)),
      x2: toX(x2),
      y2: toY(yAt(x2)),
    };
  };

  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label="Coordinate plane"
      >
        <line x1={pad} y1={oy} x2={W - pad} y2={oy} stroke="var(--border-strong)" strokeWidth="1" />
        <line x1={ox} y1={pad} x2={ox} y2={H - pad} stroke="var(--border-strong)" strokeWidth="1" />
        {figure.lines.map((ln, i) => {
          const s = lineSeg(ln.m, ln.b);
          return (
            <line
              key={i}
              {...s}
              stroke="var(--accent)"
              strokeWidth="2"
              opacity={0.9}
            />
          );
        })}
        {(figure.points ?? []).map((p, i) => (
          <g key={i}>
            <circle cx={toX(p.x)} cy={toY(p.y)} r="4" fill="var(--warn)" />
            {p.label && (
              <text
                x={toX(p.x) + 8}
                y={toY(p.y) - 8}
                className="figure-vertex"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function TriangleAnglesFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'triangle-angles' }>;
}) {
  const size = FIGURE_VIEW_SIZE;
  const { A, B, C } = triangleVertices(
    figure.measures.A,
    figure.measures.B,
    figure.measures.C,
  );
  // Angle measures sit farther out; vertex letters closer to the corner
  const labA = exteriorLabelPoint(A, B, C, 30, size);
  const labB = exteriorLabelPoint(B, A, C, 30, size);
  const labC = exteriorLabelPoint(C, A, B, 30, size);
  const letA = vertexLetterPoint(A, B, C, 12, size);
  const letB = vertexLetterPoint(B, A, C, 12, size);
  const letC = vertexLetterPoint(C, A, B, 12, size);
  const poly = `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`;

  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
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
        <AngleLabel
          x={labA.x}
          y={labA.y}
          text={figure.labels.A}
          hidden={figure.labels.A === '?'}
        />
        <AngleLabel
          x={labB.x}
          y={labB.y}
          text={figure.labels.B}
          hidden={figure.labels.B === '?'}
        />
        <AngleLabel
          x={labC.x}
          y={labC.y}
          text={figure.labels.C}
          hidden={figure.labels.C === '?'}
        />
        <text x={letA.x} y={letA.y} className="figure-vertex" textAnchor="middle" dominantBaseline="middle">
          A
        </text>
        <text x={letB.x} y={letB.y} className="figure-vertex" textAnchor="middle" dominantBaseline="middle">
          B
        </text>
        <text x={letC.x} y={letC.y} className="figure-vertex" textAnchor="middle" dominantBaseline="middle">
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
  const W = 260;
  const H = 160;
  const O = { x: W / 2, y: H * 0.62 };
  const leftEnd = { x: 28, y: O.y };
  const rightEnd = { x: W - 28, y: O.y };
  const rayRad = (Math.PI * figure.leftDeg) / 180;
  const rayLen = 78;
  const ray = {
    x: O.x + rayLen * Math.cos(Math.PI - rayRad),
    y: O.y - rayLen * Math.sin(Math.PI - rayRad),
  };
  const leftLab = clampPt({ x: O.x - 48, y: O.y - 36 }, W, 16);
  // nudge y if near top
  leftLab.y = Math.max(22, leftLab.y);
  const rightLab = clampPt({ x: O.x + 48, y: O.y - 36 }, W, 16);
  rightLab.y = Math.max(22, rightLab.y);

  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label={`Linear pair ${figure.leftLabel} and ${figure.rightLabel}`}
      >
        <line
          x1={leftEnd.x}
          y1={leftEnd.y}
          x2={rightEnd.x}
          y2={rightEnd.y}
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <line
          x1={O.x}
          y1={O.y}
          x2={ray.x}
          y2={ray.y}
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <circle cx={O.x} cy={O.y} r="3.5" fill="var(--accent)" />
        <AngleLabel
          x={leftLab.x}
          y={leftLab.y}
          text={figure.leftLabel}
          hidden={figure.leftLabel === '?'}
        />
        <AngleLabel
          x={rightLab.x}
          y={rightLab.y}
          text={figure.rightLabel}
          hidden={figure.rightLabel === '?'}
        />
      </svg>
    </div>
  );
}

function VerticalAnglesFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'vertical-angles' }>;
}) {
  const W = 260;
  const H = 200;
  const O = { x: W / 2, y: H / 2 };
  // two lines through origin at angles
  const a1 = (figure.line1Deg * Math.PI) / 180;
  const a2 = (figure.line2Deg * Math.PI) / 180;
  const L = 95;
  const line = (ang: number) => ({
    x1: O.x + L * Math.cos(ang),
    y1: O.y - L * Math.sin(ang),
    x2: O.x - L * Math.cos(ang),
    y2: O.y + L * Math.sin(ang),
  });
  const l1 = line(a1);
  const l2 = line(a2);
  // labels in the four wedges — opposite wedges equal
  const mid = (ang: number, r: number) =>
    clampPt(
      {
        x: O.x + r * Math.cos(ang),
        y: O.y - r * Math.sin(ang),
      },
      W,
      16,
    );
  // angle bisectors of adjacent wedges (approx)
  const bis1 = (a1 + a2) / 2;
  const bis2 = bis1 + Math.PI / 2;
  const pOpp1 = mid(bis1, 42);
  const pAdj = mid(bis2, 42);
  const pOpp2 = mid(bis1 + Math.PI, 42);
  const pAdj2 = mid(bis2 + Math.PI, 42);

  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label="Vertical angles"
      >
        <line {...l1} stroke="var(--accent)" strokeWidth="2" />
        <line {...l2} stroke="var(--accent)" strokeWidth="2" />
        <circle cx={O.x} cy={O.y} r="3.5" fill="var(--accent)" />
        <AngleLabel x={pOpp1.x} y={pOpp1.y} text={figure.labels.opp1} hidden={figure.labels.opp1 === '?'} />
        <AngleLabel x={pOpp2.x} y={pOpp2.y} text={figure.labels.opp2} hidden={figure.labels.opp2 === '?'} />
        <AngleLabel x={pAdj.x} y={pAdj.y} text={figure.labels.adj1} hidden={figure.labels.adj1 === '?'} />
        <AngleLabel x={pAdj2.x} y={pAdj2.y} text={figure.labels.adj2} hidden={figure.labels.adj2 === '?'} />
      </svg>
    </div>
  );
}

function ComplementaryFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'complementary' }>;
}) {
  const W = 220;
  const H = 180;
  // right angle at origin: horizontal + vertical, ray splitting
  const O = { x: 50, y: 140 };
  const rayRad = (Math.PI * figure.aDeg) / 180;
  const rayLen = 100;
  const ray = {
    x: O.x + rayLen * Math.cos(rayRad),
    y: O.y - rayLen * Math.sin(rayRad),
  };
  const labA = clampPt(
    {
      x: O.x + 48 * Math.cos(rayRad / 2),
      y: O.y - 48 * Math.sin(rayRad / 2),
    },
    Math.max(W, H),
    14,
  );
  // clamp into actual view
  labA.x = Math.min(W - 14, Math.max(14, labA.x));
  labA.y = Math.min(H - 14, Math.max(14, labA.y));
  const midB = (rayRad + Math.PI / 2) / 2;
  const labB = {
    x: Math.min(W - 14, Math.max(14, O.x + 52 * Math.cos(midB))),
    y: Math.min(H - 14, Math.max(14, O.y - 52 * Math.sin(midB))),
  };

  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label="Complementary angles"
      >
        {/* right angle corner */}
        <line x1={O.x} y1={O.y} x2={O.x + 120} y2={O.y} stroke="var(--accent)" strokeWidth="2" />
        <line x1={O.x} y1={O.y} x2={O.x} y2={O.y - 120} stroke="var(--accent)" strokeWidth="2" />
        <line x1={O.x} y1={O.y} x2={ray.x} y2={ray.y} stroke="var(--accent)" strokeWidth="2" />
        {/* right-angle mark */}
        <path
          d={`M ${O.x + 12} ${O.y} L ${O.x + 12} ${O.y - 12} L ${O.x} ${O.y - 12}`}
          fill="none"
          stroke="var(--fg-mute)"
          strokeWidth="1.5"
        />
        <circle cx={O.x} cy={O.y} r="3" fill="var(--accent)" />
        <AngleLabel x={labA.x} y={labA.y} text={figure.aLabel} hidden={figure.aLabel === '?'} />
        <AngleLabel x={labB.x} y={labB.y} text={figure.bLabel} hidden={figure.bLabel === '?'} />
      </svg>
    </div>
  );
}

function ExteriorAngleFigure({
  figure,
}: {
  figure: Extract<FigureSpec, { kind: 'exterior-angle' }>;
}) {
  const size = FIGURE_VIEW_SIZE;
  // Interior angles A,B at remote; C adjacent to exterior E
  // C + E = 180, E = A + B
  const { A, B, C } = triangleVertices(
    figure.measures.A,
    figure.measures.B,
    figure.measures.C,
  );
  // Extend side BC beyond C for exterior
  const vx = C.x - B.x;
  const vy = C.y - B.y;
  const vlen = Math.hypot(vx, vy) || 1;
  const ext = {
    x: C.x + (vx / vlen) * 48,
    y: C.y + (vy / vlen) * 48,
  };
  // clamp extension end slightly
  const extClamped = clampPt(ext, size, 12);
  const labA = exteriorLabelPoint(A, B, C, 28, size);
  const labB = exteriorLabelPoint(B, A, C, 28, size);
  const labE = clampPt(
    {
      x: C.x + (extClamped.x - C.x) * 0.55 + (A.x - C.x) * 0.08,
      y: C.y + (extClamped.y - C.y) * 0.55 + (A.y - C.y) * 0.08,
    },
    size,
    16,
  );

  return (
    <div className="figure-wrap" data-testid="figure-view">
      <svg
        className="figure-svg"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="Exterior angle of a triangle"
      >
        <polygon
          points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
          fill="var(--accent-soft)"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <line
          x1={C.x}
          y1={C.y}
          x2={extClamped.x}
          y2={extClamped.y}
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <AngleLabel x={labA.x} y={labA.y} text={figure.labels.A} hidden={figure.labels.A === '?'} />
        <AngleLabel x={labB.x} y={labB.y} text={figure.labels.B} hidden={figure.labels.B === '?'} />
        <AngleLabel x={labE.x} y={labE.y} text={figure.labels.E} hidden={figure.labels.E === '?'} />
        <text x={A.x} y={A.y} className="figure-vertex" textAnchor="middle" dominantBaseline="middle" dx="0" dy="-10">
          A
        </text>
        <text x={B.x} y={B.y + 14} className="figure-vertex" textAnchor="middle">
          B
        </text>
        <text x={C.x + 10} y={C.y + 4} className="figure-vertex" textAnchor="start">
          C
        </text>
      </svg>
    </div>
  );
}

function AngleLabel({
  x,
  y,
  text,
  hidden,
  unit = '°',
  prefix = '',
}: {
  x: number;
  y: number;
  text: string;
  hidden: boolean;
  unit?: string;
  prefix?: string;
}) {
  const display =
    text === '?' ? `${prefix}?` : `${prefix}${text}${unit}`;
  const w = Math.max(28, display.length * 8.5);
  const h = 18;
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={4}
        className="figure-label-bg"
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className={hidden ? 'figure-label blank-label' : 'figure-label'}
      >
        {display}
      </text>
    </g>
  );
}
