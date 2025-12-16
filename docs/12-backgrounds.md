# Steg 12: Bakgrunder och parallax scrolling

I detta steg lägger vi till bakgrunder och parallax scrolling i spelet. Parallax scrolling är en teknik där bakgrunder rör sig i olika hastigheter för att skapa en illusion av djup. Parallax scrolling är något som används i många klassiska plattformsspel. Vi skapar också animerade bakgrundsobjekt som moln som rör sig oberoende.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Parallax Scrolling** - Skapa djup genom att röra lager i olika hastigheter
- **Tiling** - Rita upprepade texturer för stora bakgrunder
- **Background Objects** - Individuella animerade objekt i bakgrunden
- **World Wrapping** - Få objekt att loopa runt spelvärlden
- **Separation of Concerns** - Bakgrundslager vs individuella objekt

## Problemet - Platt, statisk värld

Hittills har spelet en enfärgad bakgrund. Det ser platt och tråkigt ut. Vi vill skapa en levande värld med:

- **Djup** - Parallax scrolling för att simulera 3D-djup
- **Detalj** - Animerade objekt som moln och fåglar
- **Atmosfär** - Levande känsla i spelvärlden

> 🎮 Fundera, vad gör en spelvärld rolig och intressant för dig? Med storytelling så ökar vi chansen att fånga spelaren. Visuellt intressanta miljöer är en del av detta.

## Parallax Scrolling - Illusionen av djup

Parallax scrolling betyder att bakgrunder rör sig i olika hastigheter baserat på hur långt bort de är. Där vi flyttar det som är längst bort från spelaren sakta och desto snabbare ju närmare det är.

```
Far background (himmel):    scrollSpeed: 0.3
Mid background (moln):      scrollSpeed: 0.6
Foreground (spel):          scrollSpeed: 1.0
```

När kameran rör sig 100 pixels:
- Himlen rör sig 30 pixels (0.3 × 100)
- Molnen rör sig 60 pixels (0.6 × 100)
- Spelvärlden rör sig 100 pixels (1.0 × 100)

Detta skapar en illusion av djup eftersom saker längre bort verkar röra sig långsammare.

## Background-klassen - Flexibla bakgrundslager

Vi skapar en `Background`-klass som kan hantera både tiling (det vill säga att bilden upprepas) och stretching (att bilden sträcks ut för att fylla ett område) av bilder. Den stödjer också parallax scrolling och positionering.

Du kan hitta koden i [src/Background.js](src/Background.js).

### Viktiga delar i Background.js

#### Konstruktor med options

```javascript
constructor(game, imagePath, options = {}) {
    this.tiled = options.tiled !== undefined ? options.tiled : true
    this.tileWidth = options.tileWidth || 64
    this.tileHeight = options.tileHeight || 64
    this.tileY = options.tileY !== undefined ? options.tileY : true
    this.scrollSpeed = options.scrollSpeed !== undefined ? options.scrollSpeed : 1.0
    this.yPosition = options.yPosition !== undefined ? options.yPosition : 0
    this.height = options.height || null
}
```

**Options-parametern gör klassen flexibel:**
- `tiled` - Om bilden ska upprepas eller sträckas ut
- `tileWidth/tileHeight` - Storleken på varje tile
- `tileY` - Om bilden ska tila vertikalt (annars bara horisontellt)
- `scrollSpeed` - Parallax-hastighet (0.0-1.0+)
- `yPosition` - Var lagret ska placeras vertikalt
- `height` - Hur högt lagret ska vara (null = full höjd)

#### Parallax offset i draw()

```javascript
draw(ctx, camera) {
    // Beräkna parallax offset baserat på kamera och scroll speed
    this.offsetX = camera.x * this.scrollSpeed
    this.offsetY = camera.y * this.scrollSpeed
    
    if (this.tiled) {
        this.drawTiled(ctx, camera)
    } else {
        this.drawStretched(ctx, camera)
    }
}
```

Parallax-offseten beräknas genom att multiplicera kamerans position med `scrollSpeed`. En lägre `scrollSpeed` gör att bakgrunden rör sig långsammare än kameran.

**Viktigt för pixel-perfect rendering:** I `drawTiled()` använder vi `Math.floor()` för att avrunda tile-positioner till hela pixlar. Detta förhindrar sub-pixel rendering som skapar synliga artefakter (glipor) mellan tiles.

#### Tiling med endast synliga tiles

Här har vi en ganska komplex metod för att rita endast de tiles som är synliga på skärmen. Den fungerar så att vi beräknar vilka kolumner och rader som är synliga baserat på kamerans position och storlek. När det är gjort så itererar vi enbart över dessa och ritar dem.

```javascript
drawTiled(ctx, camera) {
    const startCol = Math.floor(this.offsetX / this.tileWidth)
    const endCol = Math.ceil((this.offsetX + camera.width) / this.tileWidth)
    
    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            // Math.floor() förhindrar sub-pixel gaps mellan tiles
            const x = Math.floor(col * this.tileWidth - this.offsetX)
            const y = this.tileY 
                ? Math.floor(row * this.tileHeight - this.offsetY) 
                : drawY
            ctx.drawImage(this.image, x, y, this.tileWidth, this.tileHeight)
        }
    }
}
```

**Optimering:** Istället för att rita alla tiles i hela världen, beräknar vi bara vilka tiles som är synliga på skärmen just nu. Detta sparar prestanda i stora världar.

**tileY-flaggan:** Om `tileY` är false, ritas bara en rad av tiles. Detta är användbart för horisontella bakgrunder som molnlagret i exemplet. Men det kan också vara berg eller träd som bara behöver upprepas horisontellt.

### Skapa bakgrundslager i Level-klasser

Med vårt Level-system lägger vi nu till bakgrunder per level, inte i själva spelmotorn. Detta gör att varje level kan ha sin egen unika atmosfär. Vi skapar bakgrunder i `createBackgrounds()`-metoden i våra level-klasser:

```javascript
// I src/levels/Level1.js
createBackgrounds() {
    // Far background - blå himmel som rör sig långsamt
    this.backgrounds.push(
        new Background(this.game, blueBg, {
            tiled: true,
            tileWidth: 64,
            tileHeight: 64,
            scrollSpeed: 0.3 // Långsam parallax (långt bort)
        })
    )
    // Mid background - moln närmre marken
    this.backgrounds.push(
        new Background(this.game, bigClouds, {
            tiled: true,
            tileWidth: 448,
            tileHeight: 101,
            tileY: false, // Bara horisontell tiling
            scrollSpeed: 0.6, // Snabbare än himlen
            yPosition: this.game.height - 141, // Precis ovanför marken
            height: 101
        })
    )
}
```

Lagerordningen är viktig eftersom de ritas i den ordningen. Det första lagret är längst bak. 

1. Far background (himmel) - scrollSpeed: 0.3
2. Mid background (moln) - scrollSpeed: 0.6
3. Gameplay (plattformar, spelare) - scrollSpeed: 1.0

**Level-specifika bakgrunder:**
- `Level1` använder blå himmel (`blueBg`) för en vänlig, tutorial-känsla
- `Level2` använder rosa himmel (`pinkBg`) för en kvällsstämning som signalerar högre svårighetsgrad

## BackgroundObject - Individuella animerade objekt

Medan `Background` hanterar stora upprepade lager, behöver vi också individuella objekt som moln, fåglar, eller ballonger. För detta skapar vi `BackgroundObject`-klassen.

Du kan hitta koden i [src/BackgroundObject.js](src/BackgroundObject.js).

### Varför en separat klass?

Vi kunde ha utökat `Background` med animations-stöd, men det bryter mot **Single Responsibility Principle**:

```
Background:        Hanterar stora, upprepade lager (tiling, stretching)
BackgroundObject:  Hanterar individuella animerade objekt (movement, wrapping)
```

Detta gör koden tydligare och lättare att underhålla. Det gör också att du kan välja vad du inkluderar i ditt spel. Har du inte ett behov av animerade bakgrundsobjekt, så behöver du inte inkludera den klassen.

### Viktiga delar i BackgroundObject.js

#### Extends GameObject

```javascript
export default class BackgroundObject extends GameObject {
    constructor(game, x, y, imagePath, options = {}) {
        super(game, x, y, options.width || 64, options.height || 64)
        // ...
    }
}
```

`BackgroundObject` ärver från `GameObject` eftersom det är ett individuellt objekt med position, storlek och rendering. Detta betyder att det delar samma baskod som `Player`, `Coin`, `Enemy` etc.

#### Auto-movement med velocity

```javascript
this.velocity = {
    x: options.velocity?.x || 0,
    y: options.velocity?.y || 0
}

update(deltaTime) {
    this.x += this.velocity.x * deltaTime
    this.y += this.velocity.y * deltaTime
}
```

Till skillnad från `Background` som är statisk, kan `BackgroundObject` röra sig själv. Ett moln kan ha `velocity: { x: 0.01, y: 0 }` för att driva åt höger. Vi kan såklart ändra detta till ett negativt värde för att driva åt vänster.

#### World wrapping

När ett moln når slutet av världen, respawnas det på andra sidan. Detta skapar en oändlig loop av moln utan att behöva skapa nya objekt. Det är såklart ett val, vi skulle kunna skapa kod för att spawna nya moln istället.


```javascript
if (this.wrapX) {
    if (this.x > this.game.worldWidth) {
        this.x = -this.width * this.scale // Respawn från vänster
    } else if (this.x < -this.width * this.scale) {
        this.x = this.game.worldWidth
    }
}
```

**Viktigt:** Vi använder `this.game.worldWidth` (inte camera.width) så molnet loopar baserat på hela spelvärlden, inte bara synliga skärmen.

#### Parallax i draw()

Det här är igentligen finlir, inte npågot nödvändigt, men för att få en bättre parallax-effekt så använder vi `scrollSpeed` även här:

```javascript
draw(ctx, camera) {
    const parallaxX = camera.x * this.scrollSpeed
    const parallaxY = camera.y * this.scrollSpeed
    
    const screenX = this.x - parallaxX
    const screenY = this.y - parallaxY
    
    ctx.drawImage(this.image, screenX, screenY, 
                  this.width * this.scale, this.height * this.scale)
}
```

Även individuella objekt använder parallax. Ett moln med `scrollSpeed: 0.2` kommer röra sig mycket långsammare än kameran, vilket gör att det ser ut att vara långt bort.

#### Scale för variation

Med scale kan vi göra några moln större och andra mindre för mer variation utan att behöva olika bilder. Det är väldigt användbart för det mesta när vi gör spel och något som vi absolut skulle kunna lägga till i `GameObject`-klassen i framtiden.

```javascript
this.scale = options.scale || 1

// I draw():
ctx.drawImage(this.image, screenX, screenY, 
              this.width * this.scale, this.height * this.scale)
```

### Skapa moln i Level-klasser

Vi skapar moln i `createBackgroundObjects()`-metoden i våra level-klasser:

```javascript
// I src/levels/Level1.js
createBackgroundObjects() {
    this.backgroundObjects.push(
        new BackgroundObject(this.game, 200, 100, cloud1, {
            scrollSpeed: 0.4,      // Lite parallax
            velocity: { x: 0.015, y: 0 }, // Slow drift
            scale: 1.5             // Större
        })
    )
    this.backgroundObjects.push(
        new BackgroundObject(this.game, 600, 80, cloud2, {
            scrollSpeed: 0.4,     // Samma djup
            velocity: { x: 0.018, y: 0 }, // Snabbare drift
            scale: 1.2
        })
    )
    // ... fler moln
}
```

**Variation är nyckeln:**
- Olika positioner (x, y)
- Olika parallax-hastigheter (scrollSpeed)
- Olika drift-hastigheter (velocity.x)
- Olika storlekar (scale)

Detta skapar en levande, dynamisk himmel istället för identiska moln.

**Level-specifika skillnader:**
- `Level1` har 5 moln med hastigheter 0.015-0.022 (lugnare)
- `Level2` har 6 moln med hastigheter 0.02-0.028 (mer intensivt)

## Update och draw order i PlatformerGame.js

Ordningen är viktig för att få rätt visuellt resultat:

```javascript
// Update
update(deltaTime) {
    // ...
    this.backgroundObjects.forEach((obj) => obj.update(deltaTime))
    // ... sen spelare, fiender, etc
}

// Draw
draw(ctx) {
    ctx.clearRect(0, 0, this.width, this.height)
    
    // Rita i rätt ordning (bakifrån och framåt)
    this.backgrounds.forEach((bg) => bg.draw(ctx, this.camera))
    this.backgroundObjects.forEach((obj) => obj.draw(ctx, this.camera))
    
    // ... sen plattformar, spelare, UI, etc
}
```

**Draw order viktigt:**
1. Backgrounds (längst bak)
2. BackgroundObjects (moln, fåglar)
3. Platforms (spelvärlden)
4. Game objects (spelare, mynt, fiender)
5. UI (längst fram)

**Integrering med Level-systemet:**
- Levels definierar bakgrunder och bakgrundsobjekt i `createBackgrounds()` och `createBackgroundObjects()`
## Varför är detta bra design?

### Separation of Concerns

```
Background:       Stora, upprepade lager (tiling, parallax)
BackgroundObject: Individuella animerade objekt (movement, wrapping)
Level:            Definierar vilka bakgrunder som ska användas
PlatformerGame:   Renderar bakgrunder från aktuell level
```

Varje klass har ett tydligt ansvar. Om vi vill ändra hur tiling fungerar, ändrar vi `Background`. Om vi vill lägga till nya typer av animerade objekt, utökar vi `BackgroundObject`. Om vi vill skapa en ny visuell stil, skapar vi en ny Level-klass med andra bakgrunder.
```

Varje klass har ett tydligt ansvar. Om vi vill ändra hur tiling fungerar, ändrar vi `Background`. Om vi vill lägga till nya typer av animerade objekt, utökar vi `BackgroundObject`.

### Återanvändbarhet

`BackgroundObject` kan användas för:
- Moln som driftar
- Fåglar som flyger
- Ballonger som stiger
- Fallande löv
- Stjärnor i en rymdnivå

Samma klass, olika parametrar och bilder.

### Optimering med synliga tiles

```javascript
const startCol = Math.floor(this.offsetX / this.tileWidth)
const endCol = Math.ceil((this.offsetX + camera.width) / this.tileWidth)
```

Genom att bara rita synliga tiles sparar vi enormt med prestanda. I en värld på 3000 pixels bred skulle vi annars rita tusentals tiles varje frame, även om bara 15-20 är synliga.

### Flexibla options

Att använda ett options-objekt i konstruktorn är ett designval. På ena sidan så får vi en flexibel klass som kan anpassas för många olika scenarier utan att behöva skapa massor av olika konstruktor-varianter och vi gör även så att konstruktorn inte behöver en massa parametrar som vi kanske inte alltid behöver. Men det kan också göra det lite svårare att förstå vilka options som finns tillgängliga utan att läsa dokumentationen eller koden.

```javascript
new Background(this, imagePath, {
    tiled: true,
    tileY: false,
    scrollSpeed: 0.6,
    yPosition: this.height - 141,
    height: 101
})
Options-mönstret gör klassen extremt flexibel utan att behöva många olika konstruktor-varianter. Varje layer kan konfigurera exakt vad den behöver.

## Debug-verktyg för utveckling

För att kunna testa levels och bakgrunder snabbt har vi lagt till en debug-funktion:

**Tryck N för att byta level** - I `PlatformerGame.js` finns en kortkommando som låter dig växla mellan levels utan att behöva spela igenom dem:

```javascript
// I update() metoden
if (this.inputHandler.keys.has('n') || this.inputHandler.keys.has('N')) {
    this.inputHandler.keys.delete('n')
    this.inputHandler.keys.delete('N')
    this.currentLevelIndex = (this.currentLevelIndex + 1) % this.levels.length
    this.loadLevel(this.currentLevelIndex)
    this.gameState = 'PLAYING'
}
```

Detta visar en viktig arbetsmetod: **skapa verktyg som gör utveckling snabbare**. Istället för att spela igenom hela Level1 varje gång du vill testa Level2, trycker du bara N. Detta är ett exempel på hur professionella spelutvecklare jobbar - de skapar debug-verktyg och shortcuts för att effektivisera sitt arbete.

## Uppgifter

Det här mönstret gör klassen extremt flexibel utan att behöva många olika konstruktor-varianter. Varje layer kan konfigurera exakt vad den behöver.

## Uppgifter

### Skala och variation

Testa att lägga till en `scale`-egenskap i `GameObject`-klassen så att alla objekt kan skalas upp eller ner. Använd detta för att skapa variation i molnen genom att göra några större och andra mindre.

### Ett moln försvinner, ett moln dyker upp

Ändra i `BackgroundObject`-klassen så att när ett moln försvinner från höger sida av skärmen, så ska ett nytt moln dyka upp på vänster sida med slumpmässig y-position och storlek. Du kan såklart behållva koden för world wrapping också om du vill, men du behöver då styra om det ska respawnas eller skapas nytt.
Kom ihåg att du kan använda `markedForDeletion`-egenskapen från `GameObject` för att markera objekt som ska tas bort i nästa uppdateringscykel.

### Animerade fåglar
Skapa fåglar som flyger från höger till vänster. Fåglarna blir ett eller flera `BackgroundObject` där du använder en spritesheet för att animera vingarna. Fåglarna ska ha en slumpmässig y-position och hastighet varje gång de spawnas.
Det finns inga fåglar i resurserna, så du får hitta egna bilder eller skapa enkla fåglar själv.

### Dag och natt-cykel
Byt ut himmel-bakgrunden baserat på tid eller poäng, du kan använda `Pink.png` för solnedgång till exempel.
Du behöver bestämma var denna metod ska finnas och hur du vill hantera bytet av bakgrundsbild smidigt.

### Träd, gräs och stenar, förgrundsparallax

Lägg till ett förgrundslager (framför spelaren) med träd, gräs eller stenar som rör sig snabbare än spelaren för att skapa ännu mer djup.
Du behöver tänka på ordningen i `draw()`-metoden så att förgrundslagret ritas efter spelaren och om du vill kan du även testa att ändra opaciteten för att skapa en dimmig effekt. Det kanske rentav ska vara dimmigt i förgrunden?

## Testfrågor