# UwU Enterprises 🐱

Official website for **UwU Enterprises** — Femboy Agency.

## Stack

- [React 18](https://react.dev/) · [TypeScript 5](https://www.typescriptlang.org/) · [Vite 5](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/)
- [three.js](https://threejs.org/) — fully procedural 3D (no model/texture files needed)

## Getting Started

```bash
npm install
npm run dev        # dev server at localhost:5173
npm run typecheck  # tsc without emitting
npm run build      # tsc + vite build
```

## How the 3D "Dreamland" works

A fixed full-screen canvas (`#world`) sits behind the page. Each home-page section is a
**station** in the 3D world; scrolling (or clicking nav / the dots on the right) flies the camera
along a spline from station to station while the sky colour changes mood.

| Section    | 3D scene                        | Clickable things                                  |
|------------|---------------------------------|---------------------------------------------------|
| `#top`      | Cloud island + chibi mascot     | Mascot → switches **Outfit** (recolours the whole site) |
| `#talents`  | Runway stage with photo frames  | Frames → open the talent profile                  |
| `#about`    | Wardrobe / clothes rack         | Clothes & props → try on an outfit                |
| `#studio`   | Photo studio                    | Camera → flash + polaroid                         |
| `#services` | Gacha machine                   | Capsules / machine → pick a service               |
| `#tools`    | Tool Lab: cork moodboard + Moody window | Window -> opens the product site                 |
| `#contact`  | Rooftop at night, moon, cat     | Letter → opens mail                               |

```
src/
├── three/
│   ├── World.ts          # renderer, sky, lights, camera rig, picking
│   ├── kit.ts            # toon materials, ink outlines, shapes, sparkles
│   └── stations/*.ts     # one file per scene (hero, runway, wardrobe, studio, gacha, contact)
├── state/store.ts        # tiny shared store (outfit, active service, toasts) + OUTFITS
├── hooks/useSceneScroll.ts  # scroll position -> camera position
├── data/scenes.ts        # scene order / labels (index = station index)
├── data/index.ts         # all site copy & talents
├── sections/ pages/ components/
└── styles/global.css     # design tokens (:root vars) + all styling
```

- **Picture permission:** `blurImages: true` on a talent (src/data/index.ts) blurs all their pictures (roster, 3D scene, profile, gallery, lightbox, puzzle). `npm run build` additionally replaces their image files in `dist/` with irreversibly blurred versions (`vite.config.ts`), so the real photos are never published. Remove the flag once they approve. (`npm run dev` still serves the originals locally.)
- Add a **product/tool**: `PRODUCTS` in `src/data/index.ts` (shown in the Tool Lab section; the 3D window opens the first one).
- Add an **outfit**: `OUTFITS` in `src/state/store.ts`.
- Station positions / camera framing / sky colours: `POSES` in `src/three/World.ts`.
- Talent frames on the runway are taken from the first 3 entries of `TALENTS` (photo = `image`).
- Falls back to a flat gradient if WebGL fails; respects `prefers-reduced-motion`.

## Routes

| URL               | Page                |
|-------------------|---------------------|
| `/`               | Home (all sections) |
| `/talent/:slug`   | Talent profile page |
| `*`               | 404 Not Found       |

## Adding a Talent

Edit `src/data/index.ts`, add to the `TALENTS` array (TypeScript will enforce the shape):

```ts
{
  id: 4,
  slug: 'dein-talent',
  name: 'Dein Talent',
  category: 'Content Creator',
  tags: ['Gaming', 'IRL'],
  featured: true,
  socials: { twitch: 'https://twitch.tv/...' },
  image: '/talents/dein-talent.jpg',   // public/talents/
  bio: 'Kurzbeschreibung',
  longBio: ['Erster Absatz…', 'Zweiter Absatz…'],
  stats: [{ label: 'Plattformen', value: '3+' }],
  bookingEmail: 'talent@uwuenterprises.de',
  gallery: [
    { src: '/talents/gallery/foto.jpg', alt: 'Beschreibung', span: 2 },
  ],
}
```

## Docker & CI

```bash
npm run docker:build   # builds registry.uwuenterprises.de/ueuenterprises:latest locally
docker compose up -d   # serves it on http://localhost:8080
```

`.github/workflows/docker.yml` builds the image on every push and pushes it to
`registry.uwuenterprises.de`:

| Event            | Result                                              |
|------------------|-----------------------------------------------------|
| push to `main`   | `:latest` and `:sha-<commit>`                       |
| tag `v1.2.0`     | additionally `:1.2.0`                               |
| pull request     | build only (nothing pushed)                         |

Required repository secrets (Settings -> Secrets and variables -> Actions):
`REGISTRY_USERNAME` and `REGISTRY_PASSWORD` (a registry account / access token with push rights).
