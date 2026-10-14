export function scrollToScene(id: string, smooth = true) {
  const el = document.getElementById(id);
  if (!el) return;
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
  if (id === 'top') window.scrollTo({ top: 0, behavior });
  else el.scrollIntoView({ behavior, block: 'center' });
}
