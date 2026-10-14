import { CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'solid' | 'ghost' | 'outline';

interface PillButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  small?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

const cls: Record<ButtonVariant, string> = { solid: '', ghost: 'btn--ghost', outline: 'btn--outline' };

/** Chunky sticker button — renders <a> when href is given, otherwise <button>. */
export default function PillButton({ href, onClick, variant = 'solid', small, children, style }: PillButtonProps) {
  const className = `btn ${cls[variant]} ${small ? 'btn--sm' : ''}`;
  if (href) return <a href={href} className={className} style={style}>{children}</a>;
  return <button type="button" onClick={onClick} className={className} style={style}>{children}</button>;
}
