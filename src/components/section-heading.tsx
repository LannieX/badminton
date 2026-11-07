import type { ReactNode } from 'react';

type Props = { title: string; eyebrow: string; action?: ReactNode };

export function SectionHeading({ title, eyebrow, action }: Props) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow cyan">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
