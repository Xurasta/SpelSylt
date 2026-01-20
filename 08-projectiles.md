# Steg 8: Projektiler

I detta steg implementerar vi ett projektilsystem så spelaren kan skjuta fiender. En projektil är ett relativt enkelt `GameObject`, men det behöver hålla reda på vars det är på väg och hur långt det har flugit.

## Koncept: Projektiler som GameObject

Projektiler är objekt som:
- Skapas vid en startposition (t.ex. från spelaren)
- Rör sig i en riktning med konstant hastighet
- Försvinner vid kollision eller efter en viss distans
- Kan interagera med andra objekt (fiender, väggar)

**I vårt spel:**
- Spelaren trycker **X** för att skjuta
- Projektilen flyger i senaste rörelseriktningen
- Max räckvidd: 800px (en skärm)
- Kolliderar med fiender och plattformar

## Projektilklassen

Skapa filen `src/Projectile.js`:

```javascript
import GameObject from './GameObject.js'

export default class Projectile extends GameObject {
    constructor(game, x, y, directionX) {
        super(game, x, y, 12, 6)
        this.directionX = directionX // -1 för vänster, 1 för höger
        this.speed = 0.5 // pixels per millisekund
        this.startX = x // Spara startposition
        this.maxDistance = 800 // Max en skärm långt
        this.color = 'orange'
    }
    
    update(deltaTime) {
        // Flytta projektilen
        this.x += this.directionX * this.speed * deltaTime
        
        // Kolla om projektilen har flugit för långt
        const distanceTraveled = Math.abs(this.x - this.startX)
        if (distanceTraveled > this.maxDistance) {
            this.markedForDeletion = true
        }
    }
    
    draw(ctx, camera = null) {
        // Beräkna screen position
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Rita projektilen som en avlång rektangel
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
    }
}
```

### Viktiga delar

#### directionX
Detta används för att beräkna rörelse: `this.x += this.directionX * this.speed * deltaTime`. Vi skickar med den senaste riktningen från spelaren för att bestämma åt vilket håll projektilen ska flyga. Men systemet är inte begränsat till spelare, utan kan användas för andra objekt som kan skjuta.

#### startX och maxDistance
När vi skapar en ny projektil utgår vi från var den skapades. Vi räknar sedan ut hur långt den flugit: `Math.abs(this.x - this.startX)`. Anledningen till att vi gör det är att det är viktigt att begränsa hur många projektiler det finns i världen då det kan påverka prestanda negativt.
Ingen vill väl dessutom att det ska flyga runt projektiler överallt?

#### speed
Med speed sätter vi hur snabbt projektilen ska flyga. Det är konstant, men vi kan definitivt applicera acceleration eller luftmotstånd/fysik på projektilen om vi vill.

## Uppdatera Player.js

Lägg till skjutsystem i konstruktorn:

```javascript
constructor(game, x, y, width, height, color) {
    super(game, x, y, width, height)
    this.color = color
    
    // ... befintlig kod
    
    // Shooting system
    this.canShoot = true
    this.shootCooldown = 300 // millisekunder mellan skott
    this.shootCooldownTimer = 0
    this.lastDirectionX = 1 // Kom ihåg senaste riktningen för skjutning
}
```

#### lastDirectionX
I `lastDirectionX` sparar vi senaste riktningen spelaren rörde sig. Det används för att bestämma projektilens riktning. Vi behöver det här så att vi kan skjuta när spelaren står still.

#### Cooldown system
Utan ett sätt att begränsa hur ofta spelaren kan skjuta skulle det bli väldigt många projektiler snabbt, vilket kan påverka prestanda och spelbalans negativt. Därför använder vi en cooldown-timer som gör att spelaren måste vänta en kort stund mellan varje skott.

Detta kan med fördel kombineras med ett "ammo"-system för att ytterligare begränsa skjutandet.

Uppdatera rörelselogiken för att spara riktning:

```javascript
update(deltaTime) {
    // Horisontell rörelse
    if (this.game.inputHandler.keys.has('ArrowLeft')) {
        this.velocityX = -this.moveSpeed
        this.directionX = -1
        this.lastDirectionX = -1 // Spara riktning
    } else if (this.game.inputHandler.keys.has('ArrowRight')) {
        this.velocityX = this.moveSpeed
        this.directionX = 1
        this.lastDirectionX = 1 // Spara riktning
    } else {
        this.velocityX = 0
        this.directionX = 0
    }
    
    // ... befintlig kod (hopp, gravitation, etc)
    
    // Uppdatera shoot cooldown
    if (!this.canShoot) {
        this.shootCooldownTimer -= deltaTime
        if (this.shootCooldownTimer <= 0) {
            this.canShoot = true
        }
    }
    
    // Skjut med X-tangenten
    if ((this.game.inputHandler.keys.has('x') || this.game.inputHandler.keys.has('X')) && this.canShoot) {
        this.shoot()
    }
}
```

Att skjuta sköter vi i en egen separat metod. Det låter oss hålla koden organiserad så att all denna logik inte hamnar i update-metoden.

```javascript
shoot() {
    // Skjut i senaste riktningen spelaren rörde sig
    const projectileX = this.x + this.width / 2
    const projectileY = this.y + this.height / 2
    
    this.game.addProjectile(projectileX, projectileY, this.lastDirectionX)
    
    // Sätt cooldown
    this.canShoot = false
    this.shootCooldownTimer = this.shootCooldown
}
```

När vi skjuter en ny projektil så spawnar vi den från spelarens mitt. Det känns mer naturligt än att skjuta från hörnet.

## Uppdatera Game.js

Importera Projectile-klassen:

```javascript
import Projectile from './Projectile.js'
```

I `init()`, lägg till projektil-arrayen:

```javascript
init() {
    // ... befintlig kod (platforms, coins, enemies)
    
    // Projektiler
    this.projectiles = []
    
    // ... rest av init
}
```

Lägg till metod för att skapa projektiler:

```javascript
addProjectile(x, y, directionX) {
    const projectile = new Projectile(this, x, y, directionX)
    this.projectiles.push(projectile)
}
```

### Varför en egen metod

Detta är starkt kopplat till att förstå hur vi fördelar ansvar mellan klasserna i spelet:
- Player behöver inte veta hur Projectile skapas
- Game ansvarar för alla objekt i världen

I `update()`, efter fiendekollisioner, lägg till projektillogik:

```javascript
// Uppdatera projektiler
this.projectiles.forEach(projectile => {
    projectile.update(deltaTime)
    
    // Kolla kollision med fiender
    this.enemies.forEach(enemy => {
        if (projectile.intersects(enemy) && !enemy.markedForDeletion) {
            enemy.markedForDeletion = true
            projectile.markedForDeletion = true
            this.score += 50 // Bonuspoäng för att döda fiende
        }
    })
    
    // Kolla kollision med plattformar/världen
    this.platforms.forEach(platform => {
        if (projectile.intersects(platform)) {
            projectile.markedForDeletion = true
        }
    })
})

// Ta bort alla objekt markerade för borttagning
this.coins = this.coins.filter(coin => !coin.markedForDeletion)
this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion)
this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion)
```

### Kollisionslogik

1. Uppdatera projektilens position
2. Kolla om den träffar fiende,  båda förstörs
3. Kolla om den träffar plattform. projektilen förstörs
4. Filtrera bort alla markerade objekt

I `draw()`, rita projektilerna:

```javascript
// Rita fiender med camera offset
this.enemies.forEach(enemy => {
    if (this.camera.isVisible(enemy)) {
        enemy.draw(ctx, this.camera)
    }
})

// Rita projektiler med camera offset
this.projectiles.forEach(projectile => {
    if (this.camera.isVisible(projectile)) {
        projectile.draw(ctx, this.camera)
    }
})

// ... rita spelaren och UI
```



### Utmaning 1: Variabel projektilstorlek

Lägg till en parameter för storlek:

```javascript
constructor(game, x, y, directionX, size = 12) {
    super(game, x, y, size, size / 2) // Dubbelt så bred som hög
    // ...
}

// I Player.shoot()
this.game.addProjectile(projectileX, projectileY, this.lastDirectionX, 16)
```

## Uppgifter

För att lära dig mer om projektilsystemet så kan du prova att lägga till något av följande.

### Power-ups

Lägg till snabbare projektiler med power-up. Samma tänk kan appliceras för att minska cooldown mellan projektilerna.

```javascript
// I Player
this.projectileSpeed = 0.5
this.hasPowerUp = false

shoot() {
    const speed = this.hasPowerUp ? 1.0 : 0.5
    this.game.addProjectile(x, y, directionX, speed)
}

// I Projectile
constructor(game, x, y, directionX, speed = 0.5) {
    // ...
    this.speed = speed
}
```

### Begränsad ammunition

Vi kan verkligen påverka spelbalansen och öka komplexiteten genom att begränsa hur många projektiler spelaren kan skjuta. Vi skapar en ammo variabel som vi räknar ned när spelaren skjuter.

Hur får vi mer ammo då? Antingen så behöver vi passivt öka ammo med en timer eller genom att plocka upp ammo power-ups i spelet.

```javascript
// I Player
this.maxAmmo = 10
this.currentAmmo = this.maxAmmo

shoot() {
    if (this.currentAmmo <= 0) return
    // ... skjut
    this.currentAmmo--
}

// Rita ammo i UI
ctx.fillText(`Ammo: ${this.player.currentAmmo}`, 20, 160)
```

### Projektiler påverkas av gravitation

Att projektiler flyger spikrakt kan vara tråkigt. Genom att lägga till gravitation får vi en mer realistisk båge. I grunden handlar detta om att använda gravitation från `this.game.gravity`.
Här kan du också prova att använda `this.game.friction` för att simulera luftmotstånd.

```javascript
// I Projectile
constructor(game, x, y, directionX) {
    // ...
    this.velocityY = 0
}

update(deltaTime) {
    // Horisontell rörelse
    this.x += this.directionX * this.speed * deltaTime
    
    // Vertikal rörelse (gravitation)
    this.velocityY += this.game.gravity * deltaTime
    this.y += this.velocityY * deltaTime
}
```

## Testfrågor

1. Varför använder vi `lastDirectionX` istället för `directionX` för skjutning?
2. Vad händer om vi inte har en `maxDistance` på projektiler? Varför är detta ett problem?
3. Förklara cooldown-systemet. Varför behövs både `canShoot` (boolean) och `shootCooldownTimer` (number)?
4. Vilken ordning händer saker i när spelaren trycker X? Lista stegen från input till projektilen syns på skärmen.
5. Varför markerar vi projektilen för borttagning istället för att ta bort den direkt från arrayen med `splice()`?
6. Vad är skillnaden mellan `direction` och `velocity`? När använder vi vilket?
7. Hur skulle du implementera att projektiler studsar mot väggar istället för att försvinna?

## Nästa steg
