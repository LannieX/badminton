import { useId } from 'react';

export default function RacketMark() {
  const pathId = useId();
  return (
    <span className="racket-mark" aria-hidden="true">
      <svg className="racket-mark-copy" viewBox="0 0 100 100" focusable="false">
        <defs>
          <path id={pathId} d="M50 50 m-43 0 a43 43 0 1 1 86 0 a43 43 0 1 1 -86 0" />
        </defs>
        <text>
          <textPath href={`#${pathId}`} textLength="265" lengthAdjust="spacing">
            iBadz • PLAY TOGETHER • BADMINTON •
          </textPath>
        </text>
      </svg>
      <img className="racket-mark-head" src="/images/racket-head-short-shaft.png" alt="" />
    </span>
  );
}
