import { useState } from 'react';
import theme from '../styles/theme';
import type { TalentSocials as SocialsMap } from '../types';

const PLATFORM_LABELS: Record<string, string> = {
  twitch:    'Tw',
  tiktok:    'Tk',
  instagram: 'Ig',
  youtube:   'Yt',
  twitter:   'X',
};

interface TalentSocialsProps {
  socials: SocialsMap;
}

export default function TalentSocials({ socials }: TalentSocialsProps) {
  const entries = Object.entries(socials) as [string, string][];
  if (!entries.length) return <div />;

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {entries.map(([platform, href]) => (
        <SocialDot key={platform} platform={platform} href={href} />
      ))}
    </div>
  );
}

interface SocialDotProps { platform: string; href: string }

function SocialDot({ platform, href }: SocialDotProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={platform}
      style={{
        width: 28, height: 28,
        border: `1px solid ${hovered ? theme.pink : theme.border}`,
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.6rem', fontWeight: 700,
        color: hovered ? theme.pink : theme.muted,
        textDecoration: 'none',
        transition: 'border-color 0.2s, color 0.2s',
        fontFamily: theme.fontDisplay,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {PLATFORM_LABELS[platform] ?? '•'}
    </a>
  );
}
