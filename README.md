# Toon Car Racer – Docker / Portainer stack

Brauseri võidusõidumäng **oma multiplayer serveriga**:
- avalik tubade nimekiri
- toa loomine / liitumine koodiga
- Socket.IO state relay
- üksikmäng + autod, elud, drift, võimed

## Portaineris (soovitatud)

1. Laadi projekt lahti (või clone) serverisse, nt `/opt/toon-car-racer`
2. Portainer → **Stacks** → **Add stack**
3. Name: `toon-car-racer`
4. **Build method**: Repository või upload `docker-compose.yml` + kontekst

Lihtsaim:

```bash
cd /opt/toon-car-racer
docker compose up -d --build
```

Või Portaineris Web editorisse `docker-compose.yml` sisu + **relative path** build context (kui Portainer toetab buildi).

Ava brauseris: `http://SINU_SERVER:3080`

### docker-compose.yml

```yaml
services:
  tooncar:
    build: .
    image: toon-car-racer:latest
    container_name: toon-car-racer
    restart: unless-stopped
    ports:
      - "3080:3080"
    environment:
      - PORT=3080
```

Porti saad muuta: `"8080:3080"` jne.

## Kohalikult (ilma Dockerita)

```bash
npm install
npm start
# http://localhost:3080
```

## Arhitektuur

| Osa | Tehnoloogia |
|-----|-------------|
| Client | HTML5 Canvas + Socket.IO client |
| Server | Node 20 + Express + Socket.IO |
| Deploy | Üks konteiner (staatika + API) |

Server hoiab tube mälus (restardi järel toad kaovad – sobib sõprade sessioniteks).

## Online mäng

1. Ava leht → **Online multiplayer**
2. Näed **käimasolevaid tube** (avalikud)
3. **Loo tuba** (vali avalik/privaatne) või **Liitu**
4. Host valib raja → **Alusta võistlust**

## Raskusastmest

Väike Node + Socket.IO server **ei ole keeruline**:
- tubade CRUD + nimekiri ~100 rida
- relay `socket.on("game")` → teistele toas
- Docker: üks Dockerfile + compose

Hullult raske oleks alles siis, kui tahaksid püsivat DB-d, matchmakingut, anti-cheati, region servereid jne. Selle projekti jaoks piisab sellest stackist.

## Failid

```
toon-car-racer/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server/index.js
└── public/          # index.html, game.js, style.css
```
