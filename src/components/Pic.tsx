import type { ImgHTMLAttributes } from 'react';

interface PicProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Creator has not approved their pictures yet → show blurred. */
  blur?: boolean;
}

/** <img> that can be blurred (see `blurImages` in src/data/index.ts). */
export default function Pic({ blur, ...img }: PicProps) {
  return (
    <span className={`pic ${blur ? 'is-blur' : ''}`}>
      <img {...img} draggable={blur ? false : img.draggable} onContextMenu={blur ? (e) => e.preventDefault() : undefined} />
    </span>
  );
}
