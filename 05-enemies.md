# Steg 5 - Enemies - Fiender och Health System

Vi lägger till fiender med enkel AI och ett health-system för spelaren. Men det viktigaste är att vi står inför ett **arkitekturproblem** som kräver **refaktorisering**.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Separation of Concerns** - Vem äger vilken logik?
- **Single Responsibility Principle (SRP)** - En klass, ett ansvar
- **Code Duplication Problem** - DRY (Don't Repeat Yourself)
- **Refaktorisera** - Omstrukturera kod utan att ändra beteende
- **Arkitekturbeslut** - Tre olika lösningar på samma problem

## Problemet - När Game.js växer ohållbart

Nu vill vi lägga till fiender som behöver samma platform collision-logik som Player. Vad gör vi?

**Naiv lösning: Copy-paste** → Game.js växer till 200+ rader, bugfixar på flera ställen, bryter mot DRY och SRP.

### Single Responsibility Principle - Vem ansvarar för vad?

`Game.js` har för många ansvar:
- Organisera VILKA objekt ska kolla kollision
- Implementera HUR varje objekt reagerar på kollision

**Rätt fördelning:**
- `Game`: Organiserar kollisionskontroller
- `Player`/`Enemy`: Hanterar egen collision-response

## Tre lösningar på problemet

| Lösning | Approach | Fördelar | Nackdelar |
|---------|----------|-------------|--------------|
| **1. GameObject base** | Delad metod i basklassen | Ingen duplicering | Rigit - alla objekt samma beteende |
| **2. Utils function** | Extern hjälpfunktion | Testbart, modulärt | Logiken extern, inte inkapslade |
| **3. Own methods** | Varje klass egen metod | **Flexibel, specialiserbar** | Viss duplicering (olika beteende) |

**Vi väljer Lösning 3** för:
- **Separation of Concerns**: Game organiserar, objekt hanterar
- **Single Responsibility**: Varje klass äger sin logik  
- **Flexibilitet**: Enemy vänder vid vägg, Player stannar, Boss kan studsa
- **Skalbarhet**: Nya objekttyper utan att röra Game.js

## Översikt - Vad ska vi bygga?

För att skapa ett enemy-system behöver vi:
1. **Enemy-klass** - Fiender som patrullerar och skadar spelaren.
2. **Refactoring** - Flytta `handlePlatformCollision()` till Player och Enemy.
3. **Health system** - Spelaren har health som minskar vid skada.
4. **Invulnerability** - Kort immunity efter skada för bättre spelupplevelse.
5. **Kollision för fiender** - Fiender kolliderar med plattformar, skärmkanter och varandra.
6. **UI för health** - Visa spelarens hälsa. 

## Fiender, skurakar och andra hemskheter

Vid det här laget så bör du vara ganska inne i arbetssättet vi har för att utveckla nya delar i spelet. Vi skapar en `Enemy` klass som ärver från `GameObject`, i klassen kan vi sedan börja lägga till det som gör en fiende till en fiende.

```javascript
export default class Enemy extends GameObject {
    constructor(game, x, y, width, height, patrolDistance = null) {
        super(game, x, y, width, height)
        this.color = 'red'
        
        // Fysik,samma som Player
        this.velocityX = 0
        this.velocityY = 0
        this.isGrounded = false
        
        // Patrol AI
        this.startX = x
        this.patrolDistance = patrolDistance
        this.endX = patrolDistance !== null ? x + patrolDistance : null
        this.speed = 0.1
        this.direction = 1 // 1 = höger, -1 = vänster
        
        this.damage = 1 // Hur mycket skada fienden gör
    }

    update(deltaTime) {
        // Applicera gravitation
        this.velocityY += this.game.gravity * deltaTime
        
        // Applicera luftmotstånd
        if (this.velocityY > 0) {
            this.velocityY -= this.game.friction * deltaTime
            if (this.velocityY < 0) this.velocityY = 0
        }
        
        // Patruller när på marken
        if (this.isGrounded) {
            this.velocityX = this.speed * this.direction
            
            // Om vi har en patrolldistans, vänd vid ändpunkter
            if (this.patrolDistance !== null) {
                if (this.x >= this.endX) {
                    this.direction = -1
                    this.x = this.endX
                } else if (this.x <= this.startX) {
                    this.direction = 1
                    this.x = this.startX
                }
            }
        } else {
            this.velocityX = 0
        }
        
        // Uppdatera position
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
    }
}
```

### Viktiga delar:

- **Ärver från GameObject** - Får `markedForDeletion`, `intersects()`, `getCollisionData()`.
- **Fysik** - Gravity och friction appliceras precis som för Player. Vi har viss duplicering av kod här men det är okej.
- **isGrounded** - Patruller endast när fienden står på en plattform.
- **Konfigurerbar patrol** - `patrolDistance = null` betyder kontinuerlig rörelse tills kollision.
- **Direction** - Håller reda på vilken riktning fienden rör sig.
- **Damage property** - Varje fiende äger sin egen skademängd.

## Refactoring - Flytta collision-response till objekten

**Vad är refactoring?** Omstrukturera kod för bättre design utan att ändra beteende.

### Player.handlePlatformCollision()

Flyttar logiken från Game.js till Player-klassen:

```javascript
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    if (collision) {
        if (collision.direction === 'top' && this.velocityY > 0) {
            this.y = platform.y - this.height
            this.velocityY = 0
            this.isGrounded = true
        }
        // ... andra riktningar
    }
}
```

### Enemy.handlePlatformCollision()

Enemy kan specialisera beteendet - vänder riktning vid vägg:

```javascript
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    if (collision) {
        if (collision.direction === 'top' && this.velocityY > 0) {
            // Samma som Player
        } else if (collision.direction === 'left' || collision.direction === 'right') {
            this.direction *= -1 // ⭐ Enemy-specifikt: Vänd vid vägg!
        }
    }
}
```

**Skillnad:** Player stannar, Enemy vänder - tack vare separata metoder!

### Enemy.handleEnemyCollision() och handleScreenBounds()

```javascript
// Fiender krockar och vänder
handleEnemyCollision(otherEnemy) {
    if (this.intersects(otherEnemy)) {
        this.direction *= -1
    }
}

// Vänd vid skärmkanter (om ingen patrolDistance)
handleScreenBounds(gameWidth) {
    if (this.patrolDistance === null) {
        if (this.x <= 0 || this.x + this.width >= gameWidth) {
            this.direction *= -1
        }
    }
}
```

**Resultat av refactoring:**
- Game.js: Organiserar kollisionskontroller
- Player/Enemy: Äger egna collision-responses
- Lägg till nya objekttyper (Boss, NPC) utan att ändra Game.js
- Varje klass har ett tydligt ansvarsområde (SRP)

## Health System och Invulnerability

```javascript
// Player constructor
this.maxHealth = 3
this.health = this.maxHealth
this.invulnerable = false
this.invulnerableTimer = 0
this.invulnerableDuration = 1000 // 1 sekund

// takeDamage() metod
takeDamage(amount) {
    if (this.invulnerable) return
    
    this.health -= amount
    this.invulnerable = true
    this.invulnerableTimer = this.invulnerableDuration
    
    if (this.health <= 0) {
        this.markedForDeletion = true
    }
}

// Update timer
if (this.invulnerable) {
    this.invulnerableTimer -= deltaTime
    if (this.invulnerableTimer <= 0) this.invulnerable = false
}

// Visuell feedback - blink
draw(ctx) {
    if (this.invulnerable) {
        if (Math.floor(this.invulnerableTimer / 100) % 2 === 0) return
    }
    // ... normal rendering
}
```

**UI för health:**
```javascript
// UI.draw()
ctx.fillText(`Health: ${this.game.player.health}/${this.game.player.maxHealth}`, 20, 100)

// Rita hjärtan
for (let i = 0; i < this.game.player.maxHealth; i++) {
    ctx.fillStyle = i < this.game.player.health ? '#FF0000' : '#333333'
    ctx.fillRect(20 + i * 30, 110, 20, 20)
}
```

## Refaktoriserad kollisionshantering i Game.js

Efter refactoring blir Game.js kortare och tydligare - den organiserar bara kollisioner, delegerar hantering till objekten:

```javascript
// Game.js update() - Efter refactoring
update(deltaTime) {
    // Platform collisions
    this.player.isGrounded = false
    this.platforms.forEach(platform => {
        this.player.handlePlatformCollision(platform)
    })

    this.enemies.forEach(enemy => {
        enemy.isGrounded = false
        this.platforms.forEach(platform => {
            enemy.handlePlatformCollision(platform)
        })
        enemy.handleScreenBounds(this.width)
    })

    // Enemy-enemy collisions
    this.enemies.forEach((enemy, index) => {
        this.enemies.slice(index + 1).forEach(otherEnemy => {
            enemy.handleEnemyCollision(otherEnemy)
            otherEnemy.handleEnemyCollision(enemy)
        })
    })

    // Player damage from enemies
    this.enemies.forEach(enemy => {
        if (this.player.intersects(enemy) && !enemy.markedForDeletion) {
            this.player.takeDamage(enemy.damage)
        }
    })
}
```

**Resultat:** Game.js från 100+ rader till ~30 rader collision-kod. Varje klass äger sin egen response-logik.

## Testa spelet

Nu kan du:
- Undvik röda fiender som patrullerar
- Spelaren blinkar och förlorar health vid skada
- UI visar health som text och hjärtan

## Uppgifter

### En räserfiende

**Du lär dig att skapa olika fiendetyper med olika egenskaper.**

Testa nu att skapa olika typer av fiender, det kan vara en snabbare fiende som gör mindre skada, eller en starkare fiende som gör mer skada.
Du har kontroll över dessa egenskaper via `speed` och `damage` properties i Enemy-klassen.

### Hälsa och power-ups

**Du lär dig att ärva och skapa fler objekt med olika beteenden.**

Lägg till en power-up som återställer spelarens health när den plockas upp. Du kan skapa en ny klass `HealthPack` som ärver från `GameObject` och när spelaren krockar med den så ökar du spelarens health.
Du kan begränsa health till maxHealth så att den inte ökar för mycket.

Du kan också prova att göra en power-up som ger spelaren temporär ökad speed eller minskad skada från fiender. Du får då utgå från koden där vi skapade en timer för invulnerability. Hur kan du använda samma mönster för att skapa en temporär buff?

#### En health-bar

**Du lär dig rita ut andra former och styra dem med egenskaper från spelet.**

Om du vill så kan du testa att skapa en health-bar istället för hjärtan. En health-bar är en rektangel som fylls upp baserat på spelarens health. Du kan rita en rektangel med bredd baserad på `(player.health / player.maxHealth) * this.totalBarWidth`.

### Jakten på spelaren

**Är det här tecken på intelligens? Tveksamt men du lär dig styra objekt utifrån andra objekts position och rörelse.**

Du kanske vill prova att skapa en fiende som jagar spelaren istället för att patrullera. Här är ett enkelt exempel på hur du kan implementera detta i `update()` metoden för en ny fiendetyp:

```javascript
// Följe AI - jagar spelaren
update(deltaTime) {
    if (this.player.x < this.x) {
        this.x -= this.speed * deltaTime
    } else {
        this.x += this.speed * deltaTime
    }
}
```

### Krocka med känsla

**Genom att skapa en känsla av responsivitet i spelet förbättras spelupplevelsen och vi får mer juice.**

Ett sätt att få interaktionen att kännas bättre är att lägga till knockback när spelaren tar skada. Detta kan göras genom att justera spelarens velocity när `takeDamage()` anropas.

```javascript
takeDamage(amount, knockbackX = 0) {
    if (this.invulnerable) return
    
    this.health -= amount
    this.invulnerable = true
    this.invulnerableTimer = this.invulnerableDuration
    
    // Knockback
    this.velocityX = knockbackX
    this.velocityY = -0.3 // Studsa upp lite
}
```

### En fiende med massor av hälsa

**Genom att implementera ett health-system för fiender lär du dig mer om objektorienterad programmering och hur objekt kan interagera med varandra.**

Det här kräver att vi lägger till en `health` property i Enemy-klassen och en `takeDamage()` metod som minskar fiendens health när den träffas av spelaren (t.ex. via ett projektil). När health når 0 så markeras fienden för borttagning.

Du kan börja med implementeringen genom att göra så att fienden tar skada precis som spelaren gör när de krockar.

```javascript
// I Enemy.js
this.health = 3

takeDamage(amount) {
    this.health -= amount
    if (this.health <= 0) {
        this.markedForDeletion = true
        // Spawna coin eller poäng
    }
}
```

### Hoppa på fiender

**Du lär dig använda metoden för kollision och använda dess kollisionsdata för att skapa olika interaktioner beroende på krockens riktning.**

Vi har i systemet redan metoden för att kontrollera från vilket håll spelaren krockar med fienden. Använd detta för att implementera att spelaren kan hoppa på fiender för att skada dem istället för att ta skada själv.

Du får då använda `getCollisionData()` för att avgöra om spelaren krockar med fienden från toppen. Om så är fallet så anropar du fiendens `takeDamage()` metod och studsar spelaren uppåt.

## Sammanfattning

I detta steg genomförde vi en viktig **refactoring** för Separation of Concerns:
- Flyttade collision-response från Game.js till respektive klass
- Game.js organiserar, objekt hanterar egen logik (SRP)
- Enemy system med patrol AI, health system med invulnerability
- Jämförde tre arkitekturlösningar, valde flexibel distribuerad approach

## Testfrågor

1. Jämför Game.js ansvar före/efter refactoring. Hur följer den nya strukturen Single Responsibility Principle?
2. Vem äger beslutet om VILKA objekt ska kolla kollision? Vem äger beslutet om HUR ett objekt reagerar på kollision? Varför är denna separation viktig?
3. Förklara hur blink-effekten fungerar med `Math.floor(timer / 100) % 2`. Varför behövs invulnerability?
4. Varför flyttade vi `handlePlatformCollision()` från Game.js till Player/Enemy-klasserna? Beskriv minst två konkreta problem med den gamla lösningen.
5. Jämför de tre lösningarna (GameObject base, Utils function, Own methods). I vilket scenario skulle Lösning 1 (GameObject base) faktiskt vara bättre än Lösning 3?
6. Förklara flödet när en fiende patrullerar och kolliderar med en vägg. Vilka metoder anropas och i vilken ordning?
7. Varför behövs `isGrounded = false` i början av update-loopen både för Player och Enemy? Vad händer om vi glömmer det?
8. Hur skulle du implementera en Boss-klass som studsar på plattformar (velocity vänds istället för att stoppas)? Vilken metod behöver ändras och hur?
9. Beskriv hela händelsekedjan från att spelaren krockar med en fiende till att health visas i UI. Vilka klasser är involverade och vad är deras ansvar?
10. Varför använder vi `Math.floor(timer / 100) % 2` för blink-effekten? Vad händer om vi ändrar 100 till 200? Varför `% 2`?

## Nästa steg