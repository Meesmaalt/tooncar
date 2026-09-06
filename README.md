# Toon Car Racer 3D

Kolmemõõtmeline toon-võidusõidumäng (Three.js) + online multiplayer server.

## Funktsioonid
- **Päris 3D** (Three.js): perspektiivkaamera, varjud, low-poly autod
- Rajad: ovaal, kõrb, jää, öö, kaheksa
- Autod eri statidega, elud, drift, võimed (rakett, nitro, kilp…)
- Online: tubade nimekiri, loo/liitu, Socket.IO

## Docker / Portainer

```bash
docker compose up -d --build
# http://localhost:3080
```

## Kohalikult

```bash
npm install
npm start
```

## Juhtimine
WASD · SPACE võime · SHIFT drift

## Stack
- Client: Three.js r170 + Socket.IO
- Server: Node 20 + Express + Socket.IO
- Deploy: üks Docker konteiner (port 3080)
