import { ReactNode } from 'react';

export function SectionTag({ children, kana }: { children: ReactNode; kana?: string }) {
  return (
    <p className="tag">
      ✦ {children}{kana && <span className="kana">{kana}</span>}
    </p>
  );
}
