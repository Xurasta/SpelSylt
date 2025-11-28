# Steg 7: Kamera och sidscrolling

I detta steg lägger vi till ett kamerasystem som följer spelaren. Detta är grundläggande för sidscrolling-spel där spelvärlden är större än skärmen.

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
        
        // Clampa kameran till världens gränser
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
    
    // Översätt världskoordinater till skärmkoordinater
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        }
    }
    
    // Översätt skärmkoordinater till världskoordinater
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        }
    }
}
```

## Uppdatera Game.js

Importera kameran:
```javascript
import { Camera } from './Camera.js'
```

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

I `draw()`, använd kameran för att endast rita synliga objekt och ge dem rätt position:
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
Istället för att kameran hoppar direkt till spelaren, använder vi lerp för mjuk följning:
```javascript
this.x += (this.targetX - this.x) * this.smoothing
```

Om `smoothing = 0.1` tar kameran 10% av steget varje frame. Detta ger en smidig kamerarörelse.

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

## Testfrågor

1. Vad är skillnaden mellan världskoordinater och skärmkoordinater?

2. Om spelaren är på `x = 1500` och kameran är på `x = 1200`, var på skärmen ritas spelaren?

3. Vad gör `smoothing`-parametern i kameran?

4. Varför är visibility culling viktigt?

5. Hur översätter vi från världskoordinater till skärmkoordinater?

6. Vad händer om vi glömmer att clampa kameran till världens gränser?

7. Varför ska UI-element (som hälsa) INTE använda kamera-offset?

8. Vad är lerp och varför använder vi det för kamerarörelse?

9. Om `worldWidth = 2400` och `camera.width = 800`, vilket är det högsta värdet `camera.x` kan ha?

10. Hur vet vi om ett objekt är synligt i kameran? Skriv pseudokod.

## Nästa steg

Nu har vi ett fungerande kamerasystem! I nästa steg ska vi lägga till projektiler (skjuta) vilket gör att vi kan bygga space shooter och twinstick shooter.
