# Steg 7: Kamera och sidscrolling

I detta steg lägger vi till ett kamerasystem som följer spelaren. Kameran låter oss skapa en spelvärld som är större än själva skärmen och hanterar hur vi ritar objekt relativt till kamerans position.

## Koncept: Världskoordinater vs skärmkoordinater

Fram tills nu har alla objekt ritats direkt på skärmen – deras `x` och `y` koordinater motsvarar exakt pixlar på canvas. Men när vi vill ha en värld som är större än skärmen behöver vi två olika koordinatsystem:

- **Världskoordinater**: Objektets faktiska position i spelvärlden (t.ex. `x = 1500`)
- **Skärmkoordinater**: Var på skärmen objektet ska ritas (t.ex. `screenX = 700`)

Kameran är det som översätter mellan dessa två:
```
screenX = worldX - camera.x
screenY = worldY - camera.y
```

Om spelaren står på `x = 1000` och kameran är på `x = 800`, så ritas spelaren på `screenX = 200`.

> 🛟 Åh nej matte! Tycker du det är snurrigt att vi drar bort kamerans position? Tänk så här: Om du tar ett steg till HÖGER (ökar x), så ser det ut som att trädet bredvid dig flyttar sig till VÄNSTER (minskar x) i ditt palle. Det är därför vi använder minus!

## Kameraklassen

Som i tidigare delar så skapar vi en ny klass för att samla den logik som hör till det vi jobbar med – i detta fall kameran.
Skapa filen `src/Camera.js`:

```javascript
export class Camera {
    constructor(x, y, width, height) {
        this.x = x                    // Kamerans position i världen
        this.y = y
        this.width = width            // Viewportens storlek (canvas storlek)
        this.height = height
        this.worldWidth = width       // Världens totala storlek
        this.worldHeight = height
        this.smoothing = 0.1          // Hur snabbt kameran följer (0-1)
    }
    
    // Sätt världens gränser
    setWorldBounds(worldWidth, worldHeight) {
        this.worldWidth = worldWidth
        this.worldHeight = worldHeight
    }
    
    // Följ ett objekt (t.ex. spelaren) 
    follow(target) {
        // Centrera kameran på target
        this.targetX = target.x + target.width / 2 - this.width / 2
        this.targetY = target.y + target.height / 2 - this.height / 2
    }
    
    // Uppdatera kamerans position med smoothing
    update(deltaTime) {
        if (this.targetX !== undefined) {
            // Linear interpolation (lerp) för smooth följning
            this.x += (this.targetX - this.x) * this.smoothing
            this.y += (this.targetY - this.y) * this.smoothing
        }
        
        // Clampa, begränsa kameran till världens gränser
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width))
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height))
    }
    
    // Kolla om ett objekt är synligt i kameran (för culling)
    isVisible(object) {
        return object.x + object.width > this.x &&
               object.x < this.x + this.width &&
               object.y + object.height > this.y &&
               object.y < this.y + this.height
    }
}
```

Med en follow metod så skapar vi ett kamera system som följer spelaren och gör att vi kan ha en spelvärld som är större än själva skärmen. Men även att vi kan följa ett `GameObject` som har `x` och `y` koordinater i världskoordinater. Det låter oss även flytta kameran till andra objekt i världen, som till exempel ett `Goal` eller en fiende.

> 🎮 Look ahead! I snabba spel som Sonic vill man se vad som kommer framför en. Försök ändra kameran så den inte centrerar spelaren exakt, utan ligger 100 pixlar framför: `this.x = this.player.x - this.width * 0.5 + 100`

## Uppdatera Game.js

I `Game.js` behöver vi nu göra flera stora förändringar då världen, eller vår level, nu har ett större format. Börja med att importera `Camera`-klassen.

I konstruktorn, skapa en större värld och initiera kameran:
```javascript
// Värld storlek (större än skärmen)
this.worldWidth = this.width * 3  // 2400px bred värld
this.worldHeight = this.height    // Samma höjd som skärmen

// Skapa kamera
this.camera = new Camera(0, 0, this.width, this.height)
this.camera.setWorldBounds(this.worldWidth, this.worldHeight)
```

I `init()`, lägg till fler plattformar utanför skärmen:
```javascript
// Fler plattformar för sidscrolling
new Platform(900, 450, 150, 20),
new Platform(1100, 400, 150, 20),
new Platform(1300, 350, 150, 20),
// ... etc
```

Uppdatera fiender att hantera världens bredd:
```javascript
enemy.handleScreenBounds(this.worldWidth)  // Istället för this.width
```

I `update()`, låt kameran följa spelaren:
```javascript
// Uppdatera kamera
this.camera.follow(this.player)
this.camera.update(deltaTime)
```

I `draw()`, använd kameran för att endast rita synliga objekt och ge dem rätt position. Att rita enbart synliga objekt kallas för visibility culling och det gör vi för att förbättra prestanda när världen blir stor.

```javascript
// Rita endast synliga plattformar
this.platforms.forEach(platform => {
    if (this.camera.isVisible(platform)) {
        platform.draw(ctx, this.camera)
    }
})

// Rita spelaren
if (this.camera.isVisible(this.player)) {
    this.player.draw(ctx, this.camera)
}

// Rita endast synliga mynt
this.coins.forEach(coin => {
    if (this.camera.isVisible(coin)) {
        coin.draw(ctx, this.camera)
    }
})

// Rita endast synliga fiender
this.enemies.forEach(enemy => {
    if (this.camera.isVisible(enemy)) {
        enemy.draw(ctx, this.camera)
    }
})
```

## Uppdatera alla draw-metoder

Varje draw-metod behöver nu ta emot kameran och översätta sina koordinater:

### GameObject.js (basklassen)
```javascript
draw(ctx, camera = null) {
    // Gör inget, implementera i subklasser
}
```

### Player.js
```javascript
draw(ctx, camera = null) {
    // Beräkna screen position (om camera finns)
    const screenX = camera ? this.x - camera.x : this.x
    const screenY = camera ? this.y - camera.y : this.y
    
    // Rita spelaren på screen position
    ctx.fillStyle = this.color
    ctx.fillRect(screenX, screenY, this.width, this.height)
    
    // Rita ögon på screen position
    ctx.fillStyle = 'white'
    ctx.fillRect(screenX + this.width * 0.2, screenY + this.height * 0.2, ...)
    // ... etc
}
```

### Platform.js, Coin.js, Enemy.js
Samma mönster – lägg till `camera = null` parameter och översätt alla `this.x` till `screenX` och `this.y` till `screenY`.

## Viktiga koncept

### 1. Linear interpolation (lerp)
Istället för att kameran hoppar direkt till spelaren, använder vi lerp för mjuk följning. Lerp är ett sätt att interpolera mellan två värden på ett smidigt sätt. Med att interpolera menas att uppskatta värdet mellan två punkter.

```javascript
this.x += (this.targetX - this.x) * this.smoothing
```

Om `smoothing = 0.1` tar kameran 10% av steget varje frame. Detta ger en smidig kamerarörelse. Med ett högre värde blir kameran snabbare på att följa spelaren.

### 2. Visibility culling
Vi kollar om objekt är inom kamerans viewport innan vi ritar dem:
```javascript
if (this.camera.isVisible(platform)) {
    platform.draw(ctx, this.camera)
}
```

Detta är viktigt för prestanda när världen blir stor.

### 3. Clamping
Vi hindrar kameran från att gå utanför världens gränser:
```javascript
this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width))
```

### 4. UI ritas utan kamera
Saker som hälsa, mynt-räknare etc. ska alltid vara synliga och ritas UTAN kamera-offset:
```javascript
// UI ritas alltid på fasta positioner
ctx.fillText(`❤️ ${this.player.health}`, 10, 30)  // Ingen camera här!
```

## Testa det

När du kör spelet nu ska:
1. Kameran följa spelaren när hen rör sig
2. Världen vara större än skärmen (2400px bred)
3. Plattformar och fiender synas utanför den ursprungliga skärmen
4. Kameran sluta vid världens kanter

## Uppgifter

### Flytta kameran till ett annat objekt

Vårt system tillåter oss att flytta / följa ett annat objekt med kameran. Vi kan se det som grunden till att göra cutscenes tillexempel.

Lägg till en knapp för att växla mellan att följa spelaren och att följa en fiende:

```javascript
// I Game.js constructor
this.cameraTargetIndex = 0  // 0 = player, 1+ = enemies
this.cameraTargets = []     // Array med alla möjliga targets

// I init() - bygg targets array
this.cameraTargets = [this.player, ...this.enemies]

// I update() - hantera target switching
if (this.inputHandler.keys.has('c') || this.inputHandler.keys.has('C')) {
    // Växla till nästa target
    this.cameraTargetIndex = (this.cameraTargetIndex + 1) % this.cameraTargets.length
    
    // Ta bort key för att förhindra spam
    this.inputHandler.keys.delete('c')
    this.inputHandler.keys.delete('C')
    
    console.log(`Camera following: ${this.cameraTargetIndex === 0 ? 'Player' : 'Enemy ' + this.cameraTargetIndex}`)
}

// Följ det valda target
const currentTarget = this.cameraTargets[this.cameraTargetIndex]
if (currentTarget && !currentTarget.markedForDeletion) {
    this.camera.follow(currentTarget)
} else {
    // Om target är borttaget (t.ex. fiende död), gå tillbaka till spelaren
    this.cameraTargetIndex = 0
    this.camera.follow(this.player)
}

this.camera.update(deltaTime)
```

**Testa:**
1. Starta spelet
2. Tryck **C** för att växla till första fienden
3. Kameran följer nu fienden medan spelaren försvinner ur bild
4. Tryck **C** igen för nästa fiende
5. Efter sista fienden, återgår den till spelaren

**Varför är detta användbart?**
- **Debug viewing** - Se vad som händer i andra delar av världen
- **Cutscenes** - Skapa cinematiska sekvenser som fokuserar på olika objekt
- **Spectator mode** - Låt spelaren observera efter död
- **Tutorial sequences** - Visa spelaren viktiga platser i världen

### Få kameran att skaka

Screen shake är en klassisk effekt för explosioner, skador eller kraftfulla händelser. För att implementera detta så behöver vi en timer för att hålla reda på hur länge skakningen ska pågå. För själva skaningen använder vi oss a flera steg. Först så sparar vi cavnvasen med `ctx.save()`, vi flyttar sedan allt vi har ritat ut med `ctx.translate()` med slumpmässiga offsetar. När vi ritat färdigt så använder vi `ctx.restore()` för att återställa canvas till ursprungsläget.

Sen ritar vi användargränssnittet (UI) utan att påverkas av skakningen, så att det alltid är stabilt och läsbart.

```javascript
// I Camera.js
shake(intensity = 10, duration = 300) {
    this.shakeIntensity = intensity
    this.shakeDuration = duration
    this.shakeTimeRemaining = duration
}

update(deltaTime) {
    // ... befintlig kod ...
    
    // Hantera screen shake
    if (this.shakeTimeRemaining > 0) {
        this.shakeTimeRemaining -= deltaTime
        
        // Beräkna progress (1.0 -> 0.0) för avtagande intensitet
        const progress = this.shakeTimeRemaining / this.shakeDuration
        const currentIntensity = this.shakeIntensity * progress
        
        // Random offset baserat på intensitet
        this.shakeOffsetX = (Math.random() - 0.5) * currentIntensity * 2
        this.shakeOffsetY = (Math.random() - 0.5) * currentIntensity * 2
    } else {
        this.shakeOffsetX = 0
        this.shakeOffsetY = 0
    }
}

// I Game.js draw() - applicera shake till hela canvas
draw(ctx) {
    // Applicera camera shake genom att flytta hela canvas
    ctx.save()
    if (this.camera.shakeOffsetX || this.camera.shakeOffsetY) {
        ctx.translate(this.camera.shakeOffsetX, this.camera.shakeOffsetY)
    }
    
    // ... rita alla game objects med kamera ...
    // De skakar automatiskt eftersom hela canvas är förskjuten
    
    // Återställ canvas transformation
    ctx.restore()
    
    // Rita UI utan shake (efter restore)
    this.ui.draw(ctx)
}

// Användning när spelaren tar skada (i Player.js)
takeDamage(amount) {
    // ...
    this.game.camera.shake(15, 200)  // 15px intensitet, 200ms
}

// När fiende dödas (i Game.js)
this.game.camera.shake(8, 150)   // Mindre shake
```

### Juice!
Små visuella effekter som dessa kallas för "game feel" eller "juice" och är avgörande för att göra spelet kännas responsivt och tillfredsställande. Utan dessa känns spelet platt och livlöst, med dem känns varje handling viktig och kraftfull.

## Testfrågor

1. Vad är skillnaden mellan världskoordinater och skärmkoordinater?
2. Om spelaren är på `x = 1500` och kameran är på `x = 1200`, var på skärmen ritas spelaren?
3. Vad gör `smoothing`-parametern i kameran?
4. Varför är visibility culling viktigt?
5. Hur översätter vi från världskoordinater till skärmkoordinater?
6. Vad händer om vi glömmer att clampa kameran till världens gränser?
7. Varför ska UI-element (som hälsa) INTE använda kamera-offset?
8. Vad är lerp och varför använder vi det för kamerarörelse?

## Nästa steg

Nu har vi ett fungerande kamerasystem! I nästa steg ska vi lägga till projektiler (skjuta) vilket gör att vi kan bygga space shooter och twinstick shooter.
