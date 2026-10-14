import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { World } from '../three/World';
import { sceneStore } from '../state/store';

/** Fixed full-screen canvas hosting the 3D dreamland. */
export default function WorldCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const navRef = useRef(navigate);
  navRef.current = navigate;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let world: World | null = null;
    try {
      world = new World(canvas, { navigate: (p) => navRef.current(p) });
      world.snapTo(sceneStore.get());
    } catch (err) {
      console.error('3D world failed to start – falling back to flat background.', err);
      document.body.classList.add('no-webgl');
      return;
    }
    const w = world;
    const unsub = sceneStore.subscribe(() => w.setTarget(sceneStore.get()));
    w.setTarget(sceneStore.get());
    return () => { unsub(); w.dispose(); };
  }, []);

  return <canvas id="world" ref={ref} aria-hidden="true" />;
}
