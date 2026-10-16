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

- **Picture permission:** managed in the Creator Space (see below) - the server serves blurred copies until a talent approves.
- Add a **product/tool**: `PRODUCTS` in `src/data/index.ts` (shown in the Tool Lab section; the 3D window opens the first one).
- Add an **outfit**: `OUTFITS` in `src/state/store.ts`.
- Station positions / camera framing / sky colours: `POSES` in `src/three/World.ts`.
- Talents (and their pictures) come from the database / Creator Space; the runway shows up to 7 of them.
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

## Creator Space (logins, editing, management)

`/creator` is the login for talents and management.

| Role | Can do |
|------|--------|
| **Talent** | edit their own page: name, subtitle, category, bio, paragraphs, tags, socials, facts, profile picture, gallery (upload, reorder, alt text, puzzle lock, delete), approve / withdraw permission to show their pictures, change password |
| **Management** | everything a talent can (for every talent) + create talents **with their account**, show/hide a page, lock/unlock a login, force-blur pictures, reset passwords, reorder, delete, create other management accounts |

How it works

- `server/` is a small Node server (Fastify + SQLite via `node:sqlite` + sharp). In production it serves the
  built site **and** the API from one container; in development Vite proxies `/api` and `/media` to it.
- Data lives in `DATA_DIR` (`./data` in dev, the `/data` volume in Docker): `uwu.db` + `uploads/`. **Back this up.**
- First start: the five original talents are imported from `seed/talents/` and the first management account is
  created from `ADMIN_USERNAME` / `ADMIN_PASSWORD` (if no password is set, a random one is printed in the log and
  must be changed at first login). Seeded talents have no login yet: use *Account anlegen* in the management list.
- **Getting talents in:** in the management list click *Accounts für alle anlegen* (or *Account anlegen* per talent).
  Each account gets a random temporary password; a panel lists the access data with a ready-written German mail:
  enter the talent's private address (stored with the account, never public) and click *Mail öffnen* - it opens in
  your mail client. Passwords are only visible at that moment (only a hash is stored); *Neues Passwort* issues a new one.
  On first login the talent **must choose their own password** before they can do anything else.
- **Automatic mail (SMTP, optional):** set `SMTP_HOST`, `MAIL_FROM` (+ `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`,
  `PUBLIC_URL`, see `.env.example`). The credentials panel then offers *Per Mail senden* (and *Alle senden*) which mails the
  access data to the address stored on the account. The server only sends the still-unchanged temporary password to that stored
  address, and the startup log tells you whether the SMTP server is reachable. Without SMTP the *Mail öffnen* link keeps working.
- Passwords are hashed with scrypt, sessions are random tokens (only a hash is stored) in an `HttpOnly` cookie,
  login attempts are throttled, state-changing requests must come from the site's own origin (CSRF).
  Put the site behind HTTPS (the cookie is `Secure` automatically when the request is HTTPS / `X-Forwarded-Proto`),
  and make sure the reverse proxy forwards the `Host` header.
- **Picture permission (`blur`)** is enforced by the server: while a talent has not approved their pictures, the
  public only ever receives an irreversibly blurred copy (`/media/...`); only that talent and management get the real
  files. Unpublished talents' pictures are not public at all.

```bash
npm run dev          # Vite (web) + API with auto-reload, http://localhost:5173 ; login at /creator
npm run build        # website + compiled server
npm start            # production server (needs the build)
```

Environment variables: `SERVER_PORT` (4010; the Docker image uses 3000 internally), `DATA_DIR`, `STATIC_DIR`, `SEED_DIR`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
(see `.env.example`).

## Docker

The image is now a Node app (API + website). Mount a volume at `/data` (compose does this) or the database and
uploaded pictures are lost when the container is recreated.

```bash
cp .env.example .env     # set ADMIN_PASSWORD
docker compose up -d     # http://localhost:8080  ->  /creator
```
