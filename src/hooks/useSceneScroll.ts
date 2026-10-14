import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SCENES } from '../data/scenes';
import { sceneStore, activeSceneStore } from '../state/store';

const smooth = (x: number) => x * x * (3 - 2 * x);

/**
 * Maps scroll position → continuous scene index. The camera dwells on a
 * station while its section is on screen and flies in between.
 */
export function useSceneScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== '/') {
      sceneStore.set(pathname.startsWith('/talent/') ? 1 : SCENES.length - 1);
      activeSceneStore.set(-1);
      return;
    }

    const compute = () => {
      const centers = SCENES.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + r.height / 2;
      });
      const vc = window.scrollY + window.innerHeight / 2;
      let v = 0;
      if (vc >= centers[centers.length - 1]) v = centers.length - 1;
      else if (vc > centers[0]) {
        let i = 0;
        while (i < centers.length - 2 && vc >= centers[i + 1]) i++;
        const t = (vc - centers[i]) / Math.max(1, centers[i + 1] - centers[i]);
        v = i + smooth(Math.min(Math.max((t - 0.22) / 0.56, 0), 1));
      }
      sceneStore.set(v);
      activeSceneStore.set(Math.round(v));
    };

    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
    const late = window.setTimeout(compute, 400); // after fonts / layout settle
    return () => {
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
      window.clearTimeout(late);
    };
  }, [pathname]);
}
