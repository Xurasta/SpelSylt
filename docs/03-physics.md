# Steg 3 - Fysik i spelmotorn

Vi introducerar enkel fysik i spelet: gravitation, hopp och kollisionshantering - grunden för plattformsspel.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Gravitation** - Konstant acceleration nedåt
- **Hopp** - Applicera kraft uppåt med begränsningar
- **Riktningsbaserad kollision** - Olika respons beroende på kollisionsriktning
- **State management** - Hålla reda på om spelaren är på marken (isGrounded)
- **Game feel** - Tweaka värden för bättre spelkänsla

## Översikt

För att skapa ett fungerande plattformsspel behöver vi:
1. **Plattformar** - Statiska objekt som spelaren kan stå på, det är mer eller mindre de rektanglar vi redan har skapat.
2. **Gravitation** - Gör att spelaren faller nedåt.
3. **Hopp** - Låter spelaren hoppa uppåt.
4. **Kollisionshantering** - Gör att spelaren kan stå på plattformar.

## Plattformar

För tydlighetens skull skapar vi en ny klass för plattformarna, även om koden är mycket lik `Rectangle`.

```javascript
export default class Platform extends GameObject {
    constructor(game, x, y, width, height, color = '#8B4513') {
        super(game, x, y, width, height)
        this.color = color
    }

    update(deltaTime) {
        // Plattformar är statiska
    }

    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}
```

I nuläget så är platformarna statiska, de har ingen rörelse eller fysik. Men om så skulle vara fallet (platformar som rör sig upp och ner eller faller) så kan vi lägga till fysik i denna klass också.

## Använda plattformar

I `Game.js` konstruktor skapar vi flera plattformar. Vi kan antingen använda `this.gameObjects` arrayen eller skapa en separat array. För tydlighetens skull väljer vi en separat array.

```javascript
this.platforms = [
    // Marken
    new Platform(this, 0, this.height - 40, this.width, 40, '#654321'),
    
    // Plattformar
    new Platform(this, 150, this.height - 140, 150, 20, '#8B4513'),
    new Platform(this, 400, this.height - 200, 120, 20, '#8B4513'),
    // ... fler plattformar
]
```

Eftersom vi nu har en separat array för plattformar så behöver vi också uppdatera `update()` och `draw()` metoderna i `Game.js` för att inkludera dessa.

```javascript
update(deltaTime) {
    // samma som för gameObjects
    this.platforms.forEach(platform => platform.update(deltaTime))
}
```

```javascript
draw(ctx) {
    // samma som för gameObjects
    this.platforms.forEach(platform => platform.draw(ctx))
}
```

## Gravitation

Gravitation är en konstant acceleration nedåt. Varje frame ökar vi spelarens vertikala hastighet (`velocityY`) med gravitationsvärdet multiplicerat med `deltaTime`. Ju längre tid som går, desto snabbare faller spelaren. Hur snabbt spelaren faller styrs av gravitationen och luftmotståndet.

För att kunna implementera detta så behöver vi lägga till några nya egenskaper i `Game.js`.

```javascript
// Fysik
this.gravity = 0.001 // pixels per millisekund^2
this.friction = 0.00015 // luftmotstånd för att bromsa fallhastighet
```

Vi kan sedan uppdatera `update()` metoden i `Player.js` för att inkludera gravitationen.

```javascript
// Applicera gravitation
this.velocityY += this.game.gravity * deltaTime

// Applicera luftmotstånd (friktion)
if (this.velocityY > 0) {
    this.velocityY -= this.game.friction * deltaTime
    if (this.velocityY < 0) this.velocityY = 0
}
```

Vi har i det här fallet också tagit bort koden för att styra spelaren vertikalt med piltangenterna, eftersom gravitationen nu sköter den vertikala rörelsen.

För att behålla funktionen med våra ögon som tittar upp och ner kan vi lägga till följande kod i slutet av `update()` metoden i `Player.js`:

```javascript
// Sätt directionY baserat på vertikal hastighet för ögonrörelse
if (this.velocityY < -0.1) {
    this.directionY = -1 // tittar upp när man hoppar
} else if (this.velocityY > 0.1) {
    this.directionY = 1 // tittar ner när man faller
} else {
    this.directionY = 0
}
```

> 🎮 Vad händer om du sätter friction till 0.99 (isbana) eller 0.5 (lera)? Vad händer om gravity är negativ (-1)? (Rymdspel!). Testa värdena och se vad som känns bäst för DITT spel.

## Hopp

För att skapa en hoppmekanik så behöver vi lägga till möjligheten för spelaren att få kraft uppåt när en tangent trycks ned. Vi lägger till detta i `update()` metoden i `Player.js`. För att det inte ska gå att hoppa i luften så behöver vi också en egenskap som håller reda på om spelaren står på marken eller inte, vi kallar den `isGrounded`.

```javascript
// Hopp - endast om spelaren är på marken
if (this.game.inputHandler.keys.has(' ') && this.isGrounded) {
    this.velocityY = this.jumpPower
    this.isGrounded = false
}
```

Det är sedan den tidigare koden för att hanttera gravitationen som gör att spelaren faller nedåt igen efter hoppet.

**Missa inte att lägga till this.isGrounded = false i konstruktorn i Player.js!**

## Hur landar vi? Kollisionshantering

Så hur får vi allt detta att fungera tillsammans? Det är här kollisionshanteringen kommer in i bilden. Vi behöver kontrollera om spelaren kolliderar med någon plattform varje frame, och om så är fallet, justera spelarens position och hastighet så att hen landar på plattformen istället för att passera igenom den.

Vi behöver:

1. Kontrollera om spelaren kolliderar med en plattform
2. Bestämma från vilken riktning kollisionen sker
3. Justera spelarens position och hastighet därefter

För att göra detta så behöver vi först utöka kollisions funktionen i `GameObject.js` för att returnera från vilket håll kollisionen sker (om någon). Vi kan göra detta genom att beräkna överlappningen mellan spelaren och plattformen i alla fyra riktningar (vänster, höger, topp, botten) och sedan använda den minsta överlappningen för att bestämma kollisionsriktningen.

### Kollisionsdata med riktning

Vi skapar en funktion som ger oss en riktning på kollisionen, vi använder det när vi behöver just riktningen. I alla fall där vi inte behöver en riktning så är det mer effektivt att fortsätta använda den enklare `intersects()` metoden.

Uppdatera `GameObject.js` med följande metod:

```javascript
    // Returnerar kollisionsdata med riktning
    getCollisionData(other) {
        if (!this.intersects(other)) return null
        
        // Beräkna överlappning från varje riktning
        const overlapLeft = (this.x + this.width) - other.x
        const overlapRight = (other.x + other.width) - this.x
        const overlapTop = (this.y + this.height) - other.y
        const overlapBottom = (other.y + other.height) - this.y
        
        // Hitta minsta överlappningen för att bestämma riktning
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)
        
        // Bestäm riktning baserat på minsta överlappningen
        if (minOverlap === overlapTop) return { direction: 'top' }
        if (minOverlap === overlapBottom) return { direction: 'bottom' }
        if (minOverlap === overlapLeft) return { direction: 'left' }
        if (minOverlap === overlapRight) return { direction: 'right' }
        
        return null
    }
```

Som du ser så returnerar denna metod ett objekt med en `direction` egenskap som anger från vilken riktning kollisionen sker. Vi kan om det skulle behövas även returnera överlappningsvärdet för mer avancerad hantering.

### Hantera kollisioner i Game.js

Innan vi är färdiga med det här stora steget så behöver vi uppdatera `update()` metoden i `Game.js` för att hantera kollisioner mellan spelaren och plattformarna.

Koden fungerar så att den itererar genom alla plattformar och kontrollerar om spelaren kolliderar med någon av dem. Om en kollision upptäcks så justeras spelarens position och hastighet baserat på kollisionsriktningen.

```javascript
// Kontrollera kollisioner med plattformar
this.platforms.forEach(platform => {
    const collision = this.player.getCollisionData(platform)
    
    if (collision) {
        if (collision.direction === 'top' && this.player.velocityY > 0) {
            // Kollision från ovan - spelaren landar på plattformen
            this.player.y = platform.y - this.player.height
            this.player.velocityY = 0
            this.player.isGrounded = true
        } else if (collision.direction === 'bottom' && this.player.velocityY < 0) {
            // Kollision från nedan - spelaren träffar huvudet
            this.player.y = platform.y + platform.height
            this.player.velocityY = 0
        } else if (collision.direction === 'left' && this.player.velocityX > 0) {
            // Kollision från vänster
            this.player.x = platform.x - this.player.width
        } else if (collision.direction === 'right' && this.player.velocityX < 0) {
            // Kollision från höger
            this.player.x = platform.x + platform.width
        }
    }
})
```

Beräkningarna för kollisioner delas in i fyra fall:

1. **Från ovan** (landar): 
   - Sätt `isGrounded = true`
   - Stoppa vertikal hastighet
   - Placera spelaren ovanpå plattformen

2. **Från nedan** (bonka huvudet):
   - Stoppa vertikal hastighet
   - Placera spelaren under plattformen

3. **Från sidorna**:
   - Stoppa horisontell rörelse
   - Placera spelaren vid plattformens kant

## Testa spelet

När du kör spelet borde du nu kunna:
1. Se spelaren falla nedåt på grund av gravitation
2. Landa på plattformar
3. Hoppa mellan plattformar
4. Navigera runt i nivån

Testa att justera värdena för gravitation, friktion i `Game.js` och hoppkraft i `Player.js` för att få den känsla du vill ha i spelet.

## Uppgifter

Nu finns det verkligen många möjligheter till nya funktioner i spelet. Du får absolut utforska och experimentera utifrån vad du vill göra, men här är några förslag på vad du kan prova på:

### Dubbelhopp

En ganska vanlig funktion i plattformsspel är dubbelhopp, där spelaren kan hoppa en gång till medan hen är i luften. För att implementera detta kan du lägga till en räknare för hopp i `Player.js` som håller reda på hur många hopp spelaren har gjort sedan senaste markkontakt.

Du kan sen använda detta i villkoret för om spelaren får hoppa igen. Det sätter alltså `isGrounded` ur funktion när spelaren är i luften och bara har hoppat en gång.

### Dash

En annan rolig mekanik är att låta spelaren göra en snabb rörelse i en riktning, ofta kallad "dash". Detta kan ge spelaren möjlighet att snabbt undvika faror eller nå svåra platser. Detta påminner i stort om mekaniken i att göra ett hopp, men vi flyttar istället spelaren horisontellt med en snabb rörelse.

Precis som för ett dubbelhopp behöver du hålla reda på om spelaren har dashat (kan jämföras med isGrounded) och sedan återställa detta när en dash är klar eller en viss tid har gått.

För att tidsbestämma hur länge dashen varar kan du använda `deltaTime` för att räkna ner en timer. **Kom ihåg att alla nya egenskaper du behöver måste läggas till i konstruktorn i `Player.js`.**

```javascript
// Dash, update() i Player.js samt egenskaper i konstruktorn
if (this.game.inputHandler.keys.has('Shift') && !this.hasDashed) {
    this.velocityX = this.facingDirection * this.dashSpeed // dashSpeed är en ny egenskap
    this.hasDashed = true // ny egenskap
    this.dashTimer = this.dashDuration // dashDuration är en ny egenskap
}
// Om spelaren har dashat, räkna ner dashTimer
if (this.hasDashed) {
    this.dashTimer -= deltaTime
    if (this.dashTimer <= 0) {
        this.hasDashed = false
        this.velocityX = 0 // stoppa dash rörelsen
    }
}
```

### Vägghopp

Eftersom vi har en kollisionshantering där vi kan avgöra från vilken riktning spelaren kolliderar med plattformar, kan vi implementera vägghopp. Detta innebär att om spelaren kolliderar med en vägg (från vänster eller höger) och trycker på hoppknappen, så kan hen hoppa uppåt från väggen.

Vi behöver här alltså skapa ett undantag i hopp-logiken som tillåter hopp även när spelaren inte är `isGrounded`, men bara om hen kolliderar med en vägg.
Med en ny egenskap `isTouchingWall` som sätts i kollisionshanteringen kan vi börja med en implementation av detta.

```javascript
// Hopp - tillåt hopp från väggar
if (this.game.inputHandler.keys.has(' ') && (this.isGrounded || this.isTouchingWall)) {
    this.velocityY = this.jumpPower
    this.isGrounded = false
}
```

### Rörliga plattformar

Rörliga plattformar kan lägga till en extra dimension av utmaning i spelet. Du kan skapa en ny klass `MovingPlatform` som ärver från `Platform` och lägger till rörelse i `update()` metoden. Plattformen kan röra sig horisontellt eller vertikalt mellan två punkter. Du kan skapa och lägga till dessa plattformar i `Game.js` på samma sätt som vanliga plattformar.

## Sammanfattning

Nu har vi testat att lägga till fysik i vårt plattformsspel! Vi har implementerat gravitation, hopp och kollisionshantering mellan spelaren och plattformar. Detta ger oss en solid grund för att bygga vidare på spelet med fler funktioner och mekaniker.

Det är funktioner som detta som faktiskt börjar skapa en gameloop där spelaren kan interagera med världen på ett meningsfullt sätt.

### Testfrågor

1. Var definieras fysik-konstanterna `gravity` och `friction` och varför placeras de där?
2. Hur appliceras gravitation på spelaren i varje frame?
3. Vad är syftet med `friction` (luftmotståndet) och hur påverkar det spelarens fallhastighet? Vad händer om vi tar bort det?
4. Förklara skillnaden mellan `intersects()` och `getCollisionData()` metoderna i `GameObject`. Hur beräknar `getCollisionData()` från vilken riktning en kollision sker?
5. Varför kontrollerar vi `this.player.velocityY > 0` när vi hanterar kollision från 'top'? Vad skulle hända om vi inte hade detta villkor?
6. Vad händer med `isGrounded` egenskapen under en frames uppdatering i `Game.js`? Varför sätts den till `false` först?
7. Hur kan du justera hoppkraften för att göra spelet mer utmanande eller lättare? Vilka värden skulle du ändra och varför?
8. Hur gör physics-systemet det lättare att lägga till collectibles i nästa steg?

## Nästa steg

I nästa steg ska vi titta på hur vi kan skapa en game-loop som låter användaren plocka upp objekt och samla poäng. Byt till `04-collectibles` branchen för att fortsätta.

```bash
git checkout 04-collectibles
```

Öppna sedan filen [Steg 4 - Samla](04-collectibles.md).