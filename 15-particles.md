# Steg 15 - Partikelsystem med Object Pooling

Vi skapar ett effektivt partikelsystem med object pooling för visuella effekter som rök, damm, explosioner och magi.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Abstract classes** - Återanvändbara basklasser som inte kan instansieras direkt
- **Object Pooling** - Återanvända objekt istället för att skapa nya
- **Performance optimization** - Reverse loops och delta-time normalisering
- **Lifecycle management** - Partiklar som föds, lever och dör
- **Visual feedback (Juice)** - Göra spelet roligare att spela

## Problemet - spelet är tråkigt

Just nu händer saker omedelbart. En fiende bara försvinner när den dör. Spelaren springer utan någon visuell feedback. Det är tråkigt! I speltermer pratar man om **"Juice"** - allt det där extra som inte behövs för reglerna, men som gör det roligt: skakningar, blixtar, rök och ljud.

## Koncept - Vad är en partikel?

En partikel är ett "dumt" GameObject:
- Den kolliderar inte med något
- Den påverkar inte spelet (du dör inte av rök (spelrök iallafall))
- Den finns bara för att se snygg ut och sedan dö
- Den lever kort (0.5-2 sekunder vanligtvis)

**Exempel på partiklar:**
- Damm när spelaren springer
- Rök från explosioner
- Stjärnor när man samlar mynt
- Jordgubbssylt när fiender dör
- Magiska effekter

## Abstract Particle Class

Precis som `GameBase` är vår abstract klass för speltyper, så är `Particle` en abstract klass för alla partikeltyper. Den kan inte instansieras direkt - vi måste alltid skapa en subklass (som `Dust`).

### Varför abstract?

En abstract class definierar ett **kontrakt** - vilka egenskaper och metoder alla subklasser måste ha:

```javascript
// Detta fungerar INTE
const particle = new Particle(game, x, y) 
// Throws: "Particle är en abstract class..."

// Detta fungerar
const dust = new Dust(game, x, y)
```

### Particle.js - Bas för alla partiklar

Du kan se koden för `Particle` i [Particle.js](src/Particle.js).

### Viktiga koncept i Particle

**1. Reset-metoden**
- Används både när partikeln skapas OCH när den återanvänds från poolen
- Nollställer alla värden till startläge
- Subklasser kan override:a för custom beteende

**2. Lifecycle tracking**
- `age` - hur länge partikeln levt (millisekunder)
- `maxAge` - max livstid (Infinity = lever tills annan condition)
- `getLifetimeProgress()` - returnerar 0-1 för fade-effekter

**3. Helper metoder**
- `isOffScreen()` - kollar om partikeln är utanför världen
- Används för att döda partiklar som flugit iväg

Varför måste vi kunna rensa partiklar? Jo, för att undvika att de hänger kvar för evigt och slösar minne!

## Dust Subclass - Exempel på implementation

`Dust` är vår första konkreta partikeltyp - damm som visas när spelaren springer.  Det är ett exempel för att visa hur partikelsystemet fungerar.
Vi kan konfigurera dammet med olika egenskaper via ett `config`-objekt, men just för damm så använder vi mest slumpmässiga värden.

Du kan se koden för `Dust` i [Dust.js](src/Dust.js).

> 🛟 En skillnad vid undvikigt tidigare är att kalla på super i update och draw. Att göra det kan vara mer effektivt då vi kan samla visst beteende i förälder-klassen. Men det kan också göra koden mer svårläst då du behöver leta efter vad som sker i andra filer.

### Varför config-objekt?

Config-objektet gör partiklar flexibla:

```javascript
// Standard damm
particleManager.spawn(Dust, x, y)

// Större, långsammare damm
particleManager.spawn(Dust, x, y, { 
    size: 15, 
    shrinkRate: 0.98 
})

// Rött damm (blod?)
particleManager.spawn(Dust, x, y, { 
    color: 'rgba(255, 0, 0, 0.5)' 
})
```

## Object Pooling - Det viktigaste konceptet

> 🛟 Object pooling och dess syfte är ett avancerat koncept för att optimera prestanda genom att återanvända objekt istället för att skapa och förstöra dem hela tiden. Det räcker om du kan använda det, men läs gärna vidare.

### Problemet utan pooling

Varje gång vi skapar en partikel:
```javascript
// Skapar nytt objekt i minnet
const particle = new Dust(game, x, y) 
particles.push(particle)
```

Och när den dör:
```javascript
// Garbage collector måste städa upp
particles = particles.filter(p => !p.markedForDeletion)
```

**Med 60 FPS och 5 partiklar per frame:**
- 300 nya objekt per sekund
- 300 objekt som ska garbage collectas
- = **Lag och frame drops!**

### Lösningen: Object Pooling

Återanvänd partiklar istället för att skapa nya! Vi kan också titta på ett vanligt förekommande mönster för att hantera begränsade resurser.

```
┌───────────────────────────────────┐
│       ParticleManager             │
├───────────────────────────────────┤
│                                   │
│  POOL (Available)    ACTIVE       │
│  ┌───┐ ┌───┐        ┌───┐ ┌───┐   │
│  │ D │ │ D │        │ D │ │ D │   │
│  └───┘ └───┘        └───┘ └───┘   │
│    ↑                   ↓          │
│    └─── recycle ──────┘           │
│         (när dör)                 │
│                                   │
│  spawn() → tar från pool          │
│  update() → flyttar till pool     │
└───────────────────────────────────┘
```

### Hur pooling fungerar

**1. Spawna partikel (första gången)**
```javascript
spawn(Dust, x, y) {
    // Pool är tom, skapa ny
    particle = new Dust(game, x, y)
    pool.active.push(particle)
    return particle
}
```

**2. Spawna partikel (från pool)**
```javascript
spawn(Dust, x, y) {
    // Ta från pool istället för att skapa ny!
    particle = pool.available.pop()
    particle.reset(game, x, y) // Nollställ
    pool.active.push(particle)
    return particle
}
```

**3. Recycle partikel**
```javascript
recycle(particle) {
    pool.active.remove(particle)
    pool.available.push(particle) // Spara för senare!
}
```

### Fördelar med pooling

| Utan pooling | Med pooling |
|--------------|-------------|
| 300+ partiklar i sekunden | inga nya efter uppstart |
| Hög GC pressure | Minimal GC |
| Frame drops | Stabil 60 FPS |
| Ökad minnesanvändning över tid | Konstant minnesanvändning |

Med GC menas Garbage Collection - processen där JavaScript rensar upp oanvända objekt i minnet.

> 🧠 Tips, objekt pooling är något du kan använda för att öka prestandan i spelet på andra saker. Till exempel ljud, vi behöver inte nödvändigtvis skapa nya ljudobjekt varje gång ett ljud spelas, utan kan återanvända befintliga.

## ParticleManager - Centraliserad hantering

`ParticleManager` hanterar alla partiklar och pooling åt oss, du kan se koden i [ParticleManager.js](src/ParticleManager.js).

I ParticleManager så introducerar vi ett nytt sätt att hantera och städa upp partiklar med hjälp av **reverse loops**.

### Varför reverse loop istället för filter?

Detta är en **viktig performance-optimering** som bara behövs i högfrekventa loopar (60 gånger per sekund). Låt oss förstå varför:

#### Problem med filter()

```javascript
// Filter skapar en NY array varje frame!
particles = particles.filter(p => !p.markedForDeletion)
```

**Vad händer:**
1. `filter()` skapar en helt ny array (memory allocation)
2. Kopierar alla element som inte ska tas bort
3. Den gamla arrayen kastas bort (garbage collection)
4. Vid 60 FPS = 60 nya arrays per sekund = mycket GC!

**När filter är OK:**
- Ett-gångs operationer (inte i game loop)
- Små arrayer (< 10 element)
- Kod som körs sällan (hantera meny-val, etc)

#### Problem med forward loop + splice()

```javascript
// SKIPPAR ELEMENT!
for (let i = 0; i < particles.length; i++) {
    if (particles[i].markedForDeletion) {
        particles.splice(i, 1) // Ta bort element
        // Nu har alla element efter "i" flyttats ett steg till vänster
        // Nästa iteration kollar i+1, men vi hoppade över ett element!
    }
}
```

**Exempel på problemet:**
```javascript
const arr = ['A', 'B', 'C', 'D']
// Säg att 'B' och 'C' ska tas bort

// i = 0: 'A' behålls
// i = 1: 'B' tas bort → arr blir ['A', 'C', 'D']
// i = 2: kollar index 2, vilket nu är 'D' (vi missade 'C'!)
// Resultat: ['A', 'C', 'D'] 'C' fanns kvar!
```

#### Lösningen: Reverse loop

```javascript
// KORREKT och EFFEKTIVT
for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].markedForDeletion) {
        particles.splice(i, 1) // Ta bort
        // Vi går bakåt, så det spelar ingen roll om element shiftar
    }
}
```

**Varför det fungerar:**
```javascript
const arr = ['A', 'B', 'C', 'D']
// Säg att 'B' och 'C' ska tas bort

// i = 3: 'D' behålls
// i = 2: 'C' tas bort → arr blir ['A', 'B', 'D']
// i = 1: 'B' tas bort → arr blir ['A', 'D']
// i = 0: 'A' behålls
// Resultat: ['A', 'D'] Perfekt!
```

När vi går bakåt påverkar inte borttagningen de index vi redan kollat!

#### När ska du använda vilken metod?

| Scenario | Metod | Varför |
|----------|-------|--------|
| Game loop (60 FPS) | Reverse loop | Performance kritisk |
| Många element (100+) | Reverse loop | Filter är långsamt |
| Få element (<10) | Filter | Mer läsbar kod |
| Engångs-operation | Filter | Enkelhet > performance |
| Initialisering | Filter | Körs bara en gång |

**Exempel från vår kod:**

```javascript
// ❌ Gamla koden - kördes 60 gånger per sekund!
this.particles = this.particles.filter(p => !p.markedForDeletion)
this.enemies = this.enemies.filter(e => !e.markedForDeletion)
// = 120 nya arrays per sekund!

// ✅ Nya koden - modifierar befintlig array
for (let i = this.particles.length - 1; i >= 0; i--) {
    if (this.particles[i].markedForDeletion) {
        this.particles.splice(i, 1)
    }
}
```

#### Sammanfattning

- **Filter()** är fin och läsbar, men skapar nya arrays (garbage collection)
- **Forward loop + splice()** är buggig (skippar element)
- **Reverse loop + splice()** är korrekt och effektiv
- **Använd reverse loop** i game loops och när du har många element
- **Använd filter()** när läsbarhet är viktigare än performance

> 💡 **Tumregel:** Om koden körs varje frame (60 gånger per sekund) - optimera den. Annars, prioritera läsbarhet!

## Performance Optimeringar

> 🧠 Här kommer vi verkligen in på koncept som kan hjälpa din spelmotor att fungera bättre och utifrån detta så kan vi garantera hitta refaktoriseringar att göra i koden.

### 1. DeltaTime normalisering

Partiklar måste röra sig lika snabbt oavsett framerate:

```javascript
// ❌ Frame-beroende
this.x += this.speedX; // Snabbare på 120fps än 60fps!

// ✅ Frame-oberoende
this.x += this.speedX * deltaTime; // Samma hastighet alltid
```

För krympning använder vi exponentiell decay:

```javascript
// Normaliserat till 60fps (16ms)
this.size *= Math.pow(0.95, deltaTime / 16);
```

### 2. Camera culling

Rita bara partiklar som syns i kameran:

```javascript
draw(ctx, camera) {
    for (const particle of this.particles) {
        if (camera.isVisible(particle)) { // Kolla om synlig
            particle.draw(ctx, camera);
        }
    }
}
```

### 3. Undvik ctx.save/restore

I den mån det är möjligt, undvik att spara och återställa canvas state. Gör det bara när nödvändigt.

```javascript
// Långsamt - save/restore är dyrt
draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Snabbt - sätt bara färgen
draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
}
```

### 4. Max particle limit

```javascript
spawn(ParticleClass, x, y) {
    if (this.particles.length >= this.maxParticles) {
        return null; // Skippa om för många
    }
    // ... spawna partikel
}
```

## Använda partikelsystemet

### Setup i GameBase

```javascript
import ParticleManager from './ParticleManager.js'

export default class GameBase {
    constructor(width, height) {
        // ... andra system
        
        // Particle system med max 200 partiklar
        this.particleManager = new ParticleManager(this, 200)
    }
}
```

### Spawna partiklar i Player

I det här fallet lägger vi "spawna damm" koden i Player-klassen när spelaren springer:

```javascript
import { Dust } from './Dust.js'

export default class Player extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height)
        
        // Dust spawn throttling
        this.dustSpawnTimer = 0
        this.dustSpawnInterval = 50 // ms mellan spawns
    }
    
    update(deltaTime) {
        // ... rörelse kod
        
        // Uppdatera timer
        this.dustSpawnTimer -= deltaTime
        
        // Spawna damm när spelaren springer
        if (Math.abs(this.velocityX) > 0.15 && 
            this.isGrounded && 
            this.dustSpawnTimer <= 0) {
            
            const dustX = this.x + this.width * 0.5
            const dustY = this.y + this.height
            
            // Spawna via manager (använder pooling automatiskt!)
            this.game.particleManager.spawn(Dust, dustX, dustY)
            
            this.dustSpawnTimer = this.dustSpawnInterval
        }
    }
}
```

### Uppdatera i PlatformerGame

Vi behöver också uppdatera och rita partikelsystemet i vår game loop.

```javascript
update(deltaTime) {
    // ... uppdatera andra objekt
    
    // Uppdatera partikelsystemet
    this.particleManager.update(deltaTime)
    
    // Optimerad borttagning med reverse loops
    for (let i = this.enemies.length - 1; i >= 0; i--) {
        if (this.enemies[i].markedForDeletion) {
            this.enemies.splice(i, 1)
        }
    }
}

draw(ctx) {
    // ... rita andra objekt
    
    // Rita partiklar (med camera culling)
    this.particleManager.draw(ctx, this.camera)
}
```

## Debug Mode

Vi kan trycka **P** för att se particle stats, du hittar koden för att rita ett overlay i [UserInterface.js](src/UserInterface.js).

**Stats förklaring:**
- **Active** - Partiklar som renderas just nu
- **Pooled** - Återanvändbara partiklar i minnet
- **Total** - Totalt allokerade objekt (active + pooled)
- **Max** - Max gräns (200)
- **Pools** - Antal olika partikeltyper

## Exempel: Fler partikeltyper

Här har du ett par färdiga exempel på partikeltyper du kan använda i ditt spel!

### Spark - Gnistor som flyger upp

```javascript
export class Spark extends Particle {
    reset(game, x, y, config = {}) {
        super.reset(game, x, y)
        
        this.maxAge = 1000 // Lever 1 sekund
        this.size = Math.random() * 3 + 2
        
        // Flyg uppåt med slumpmässig vinkel
        const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI/3
        const speed = Math.random() * 0.3 + 0.2
        this.speedX = Math.cos(angle) * speed
        this.speedY = Math.sin(angle) * speed
        
        this.color = config.color ?? '#FFD700' // Guld
        this.alpha = 1.0
    }
    
    update(deltaTime) {
        super.update(deltaTime)
        
        // Fade baserat på livstid
        this.alpha = 1 - this.getLifetimeProgress()
        this.color = `rgba(255, 215, 0, ${this.alpha})`
        
        // Lägg till gravitation
        this.speedY += 0.0005 * deltaTime
        
        if (this.alpha <= 0 || this.isOffScreen()) {
            this.markedForDeletion = true
        }
    }
}

// Spawna gnistor när fiende dör
for (let i = 0; i < 10; i++) {
    this.game.particleManager.spawn(
        Spark, 
        enemy.x + enemy.width/2, 
        enemy.y + enemy.height/2
    )
}
```

### Debris - Flygande bitar

```javascript
export class Debris extends Particle {
    reset(game, x, y, config = {}) {
        super.reset(game, x, y)
        
        this.size = Math.random() * 5 + 3
        
        // Flyg åt slumpmässigt håll
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 0.4 + 0.1
        this.speedX = Math.cos(angle) * speed
        this.speedY = Math.sin(angle) * speed - 0.3 // Extra uppåt
        
        this.color = config.color ?? '#8B4513' // Brunt
        this.rotation = 0
        this.rotationSpeed = (Math.random() - 0.5) * 0.01
    }
    
    update(deltaTime) {
        super.update(deltaTime)
        
        // Gravitation
        this.speedY += 0.001 * deltaTime
        
        // Rotation
        this.rotation += this.rotationSpeed * deltaTime
        
        if (this.isOffScreen()) {
            this.markedForDeletion = true
        }
    }
    
    draw(ctx, camera = null) {
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        ctx.save()
        ctx.translate(screenX, screenY)
        ctx.rotate(this.rotation)
        ctx.fillStyle = this.color
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size)
        ctx.restore()
    }
}
```

## Sammanfattning

### Vad vi har lärt oss

* **Abstract classes** - Particle som bas, Dust/Spark/Debris som konkreta implementationer  
* **Object Pooling** - Återanvänd objekt istället för att skapa nya (60-80% mindre GC)  
* **Performance** - Reverse loops, camera culling, deltaTime normalisering  
* **Lifecycle** - age, maxAge, isOffScreen(), getLifetimeProgress()  
* **Flexibility** - Config-objekt för anpassningsbara partiklar

### Performance vinster

| Metrik | Före | Efter | Förbättring |
|--------|------|-------|-------------|
| GC pressure | Hög | Minimal | 60-80% |
| Update loops | filter() | reverse for | ~30% |
| Rendering | Alla | Culling | 50%+ |
| Frame drops | Ja | Nej | Stabilt 60 FPS |

### Nästa steg

- Lägg till fler partikeltyper (explosion, magi, blod)
- Particle emitters (konstant ström av partiklar)
- Texture-baserade partiklar (sprites istället för cirklar)
- Particle affectors (vind, turbulens, attraction)

**Pro tip:** Tweaka värden live! Ändra `shrinkRate`, `maxAge`, `size` osv och se vad som händer. Det är så man hittar det perfekta game feelet! 🎮✨

---

## Appendix: Filter vs Reverse Loop - Analys av vår kod

### Vad händer i PlatformerGame.update()?

Låt oss räkna vad som händer **varje frame (60 gånger per sekund)**:

#### Före optimering (med filter):
```javascript
// 3 filter() anrop varje frame!
this.coins = this.coins.filter(coin => !coin.markedForDeletion)
this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion)
this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion)
```

**Per sekund:**
- 180 nya arrays skapas (3 × 60 FPS)
- 180 gamla arrays ska garbage collectas
- Varje array kopierar alla element som inte ska tas bort

**I ett typiskt spel:**
- 10 coins → kopierar 10 objekt
- 5 enemies → kopierar 5 objekt  
- 3 projectiles → kopierar 3 objekt
- = **1080 objekt-kopieringar per sekund** (18 × 60)

#### Efter optimering (med reverse loop):
```javascript
// 0 nya arrays!
for (let i = this.coins.length - 1; i >= 0; i--) {
    if (this.coins[i].markedForDeletion) this.coins.splice(i, 1)
}
// ... samma för enemies och projectiles
```

**Per sekund:**
- 0 nya arrays
- 0 garbage collection av arrays
- Endast ta bort de objekt som faktiskt är markerade

### forEach() då

`forEach()` är en annan vanlig metod för att iterera över arrayer:

```javascript
this.enemies.forEach(enemy => enemy.update(deltaTime))
this.coins.forEach(coin => coin.update(deltaTime))
```

**Detta är helt OK!** Här är skillnaden:

| Operation | forEach() | filter() | reverse loop |
|-----------|-----------|----------|--------------|
| Skapar ny array? | Nej | Ja | Nej |
| Modifierar array? | Nej | Ja | Ja |
| Performance | Snabb | Långsam | Snabb |
| Garbage collection | Ingen | Mycket | Minimal |

**forEach()** itererar bara över arrayen - den skapar INTE en ny array. Det är därför den är helt OK att använda!

```javascript
// DETTA ÄR BRA - ingen ny array
this.enemies.forEach(enemy => enemy.update(deltaTime))

// DETTA ÄR INTE OPTIMALT - ny array varje frame
this.enemies = this.enemies.filter(e => !e.markedForDeletion)
```

### Praktisk benchmark

Låt oss säga vi har ett typiskt spel som kör i 5 minuter (300 sekunder):

#### Med filter():
```
180 arrays/sekund × 300 sekunder = 54,000 arrays
54,000 arrays × ~20 objekt per array = 1,080,000 element-kopieringar
Garbage collection körs ~100 gånger
Potentiella frame drops: 10-50 frames
```

#### Med reverse loop:
```
0 nya arrays
Endast ~500 splice() operationer (när objekt faktiskt dör)
Garbage collection körs ~5 gånger
Potentiella frame drops: 0-2 frames
```

### Sammanfattning

#### Använd forEach() - det är bra!
```javascript
// Läser bara, skapar ingen ny array
this.enemies.forEach(enemy => enemy.update(deltaTime))
```

#### Undvik filter() i game loop
```javascript
// Skapar ny array varje frame = dåligt
this.enemies = this.enemies.filter(e => !e.markedForDeletion)
```

#### Använd reverse loop för borttagning
```javascript
// Modifierar befintlig array = bra
for (let i = this.enemies.length - 1; i >= 0; i--) {
    if (this.enemies[i].markedForDeletion) this.enemies.splice(i, 1)
}
```

**Slutsats:** I vår kod sparar vi **180 array-skapanden per sekund** genom att använda reverse loops istället för filter. Det är skillnaden mellan stabila 60 FPS och potentiella frame drops, speciellt på svagare hårdvara eller mobiler!

Så nu vet du vad du ska göra för att optimera dina spel! 
