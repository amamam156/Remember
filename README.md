<div align="center">
  <img src="frontend/public/remember-mark.svg" width="92" alt="Remember logo" />
  <h1>Remember</h1>
  <p><strong>A quiet, self-hosted home for photos, places, and the stories between them.</strong></p>
  <p>Visual memory journal · Interactive map · Private by default</p>
</div>

![Remember memory feed](docs/screenshots/feed.png)

Remember turns a camera roll into a browsable story. Add a date, place, note, and tags to each memory; then rediscover it through a visual feed, geographic map, or related moments. It is designed for personal hosting, with data and uploads staying on infrastructure you control.

> The fox travelers and all sample entries shown here are fictional demo content. No personal photos or personal accounts are included.

## See it in action

| Visual feed | Interactive memory map |
| --- | --- |
| ![A masonry feed of illustrated memories](docs/screenshots/feed.png) | ![Places connected to memories](docs/screenshots/map.png) |

| Private sign-in | Memory details |
| --- | --- |
| ![Remember sign-in with the new bookmark mark](docs/screenshots/login.png) | ![A memory with its date, place and story](docs/screenshots/detail.png) |

## What it does

- Builds a responsive, image-first timeline with multi-photo memories and tags.
- Connects memories to countries, regions, cities, coordinates, and an interactive globe.
- Keeps hotel stays, room-card photos, and trip notes beside the moments they belong to.
- Supports private password access, JWT sessions, local uploads, thumbnails, and PWA installation.
- Includes an optional showcase dataset with eight fictional memories and four original cartoon scenes.
- Leaves the existing AI digital-person experience, Johnson, as the project's dedicated AI interaction rather than adding a second assistant interface.

## Run locally

Requirements: Node.js 18+, npm, and SQLite.

```bash
git clone https://github.com/amamam156/Remember.git
cd Remember

cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run db:init:users
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Set `REMEMBER_INITIAL_PASSWORD` in `backend/.env`; the sign-in screen only asks for that password.

### Load the fictional showcase data

```bash
cd backend
npm run db:seed:demo
```

The default demo password is `remember-demo`. Override it with `REMEMBER_DEMO_PASSWORD` before seeding. The script only replaces memories owned by the `demo` account.

## Docker

```bash
docker compose up --build -d
```

Set `JWT_SECRET`, `REMEMBER_INITIAL_PASSWORD`, and `CORS_ORIGIN`. Place persistent storage anywhere with `REMEMBER_DATA_PATH` and `REMEMBER_UPLOADS_PATH`; otherwise local `./data` and `./uploads` directories are used.

## Stack

- React 18, TypeScript, Vite, Tailwind CSS
- Express, Prisma, SQLite
- MapLibre GL, Sharp, JWT authentication
- Docker Compose and Nginx

## Project status

Remember is a working personal project and product showcase. The journal, uploads, maps, hotels, tags, private access, and Johnson experience form its current product surface.

## License

No license has been added yet. All rights are reserved by the repository owner.
