# Steg 4 - Samla - Mynt och Score system

Vi lägger till samlarbara objekt (mynt) och ett score-system med UI. Detta ger spelet en gameplay-loop där spelaren har ett mål: samla så många mynt som möjligt.

## Översikt

För att skapa ett collectibles-system behöver vi:
1. **markedForDeletion i GameObject** - Ett gemensamt sätt att markera objekt för borttagning.
2. **Coin-klass** - Objekt som spelaren kan plocka upp.
3. **Game State** - Hålla reda på score och antal mynt samlade.
4. **UI-klass** - Visa score och statistik på skärmen.
5. **Pickup-logik** - Detektera när spelaren plockar upp mynt.

## markedForDeletion i GameObject

När en spelare plockat upp ett mynt vill vi ta bort det från spelet. Istället för att direkt ta bort objektet från arrayen (vilket kan orsaka problem under iteration) använder vi ett mönster där vi markerar objekt för borttagning med en flagga `markedForDeletion`. Efter alla uppdateringar filtrerar vi bort dessa objekt från arrayen.

Vi flyttar denna logik från att skriva den individuellt i varje klass (t.ex. `Coin`) till att vara en del av bas-klassen `GameObject`. Det är användbart för många olika typer av objekt som kan behöva tas bort (fiender, projektiler, partiklar, etc).

```javascript
export default class GameObject {
    constructor(game, x = 0, y = 0, width = 0, height = 0) {
        ...
        this.markedForDeletion = false // Ny!
    }
}
```

> 🛟 Om dina mynt blinkar men inte försvinner, har du troligen glömt !coin.markedForDeletion i din if-sats. Då plockar du upp samma mynt 60 gånger i sekunden!

Om vi ska tittar på fördelar med att göra detta i ett objektorienterat perspektiv:

**Återanvändbart mönster:**
- Alla GameObjects kan markeras för borttagning
- Fungerar för coins, enemies, projectiles, particles, etc.
- Ingen klass-specifik logik behövs

**Separation of concerns:**
- Markering och faktisk borttagning är separerade
- Objekt kan markeras när som helst under update-cykeln
- Cleanup sker på ett ställe efter alla uppdateringar

Detta kan förklaras som "vem äger vad" eller "vem är ansvarig för vad":
- **GameObject/Coin ansvarar för:** Att veta om den ska tas bort (`markedForDeletion = true`)
- **Game ansvarar för:** Att faktiskt ta bort objekt från arrayen (`filter`)
- Varje klass har sitt ansvarsområde och blandar inte ihop logik

**Säkert:**
- Ingen modifiering av arrays under iteration
- Undviker index-problem

**Välkänt mönster:**
- Används i de flesta spelmotorer
- Skalbart för större projekt

## Coin-klassen - Samlarbara objekt

För att representera digitala rikedomar i spelet skapar vi en `Coin` klass som ärver från `GameObject`:

```javascript
export default class Coin extends GameObject {
    constructor(game, x, y, size = 20, value = 10) {
        super(game, x, y, size, size)
        this.size = size
        this.color = 'yellow' 
        this.value = value // Poäng för detta mynt
        
        // Bob animation
        this.bobOffset = 0
        this.bobSpeed = 0.002
        this.bobDistance = 5
    }

    update(deltaTime) {
        // Gungar myntet upp och ner
        this.bobOffset += this.bobSpeed * deltaTime
    }

    draw(ctx) {
        // Beräkna y-position med bob
        const bobY = Math.sin(this.bobOffset) * this.bobDistance
        // Rita myntet som en cirkel
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2 + bobY, this.size / 2, 0, Math.PI * 2)
        ctx.fill()
    }
}
```

Om du tidigare skapade en klass för att rita ut cirklar så ser du nog att det finns många likheter här. En sak jag ville ta med och illustrera här är hur vi kan röra på "statiska" objekt med en mindre animation (studsa upp och ner) för att ge spelet mer liv (eller juice).

### Hur fungerar animationen?

Vi använder den inbyggda funktionen `Math.sin()` för att ge ett värde som varierar mellan -1 och 1. Vi kan sedan multiplicera detta värde med en distans (`bobDistance`) för att få en smidig upp-och-ner rörelse. Vi använder även `bobSpeed` för att styra hur snabbt gungningen sker, och `deltaTime` för att säkerställa att animationen är jämn oavsett framerate.

```javascript
this.bobOffset += this.bobSpeed * deltaTime  // Ökar kontinuerligt
const bobY = Math.sin(this.bobOffset) * this.bobDistance
```

## Game State

Med game state så menas de variabler och egenskaper som håller reda på spelets nuvarande status, som poäng, antal samlade mynt, hälsa, etc. Detta är viktigt för att kunna ge feedback till spelaren och skapa mål.
Vi väljer att spara dessa i `Game.js` för att ha en central plats för spelets tillstånd. Om spelet blir väldigt stort och komplext kan vi senare överväga att flytta detta till en dedikerad state management-klass.

```javascript
// Game state
this.score = 0
this.coinsCollected = 0
```

Detta är grunden för mer avancerad state management senare. Just nu är det enkelt:
- `score` - Total poäng
- `coinsCollected` - Antal mynt samlade

Notera att varje mynts värde (`value`) ägs av `Coin` klassen själv, inte av `Game`. Detta följer separation of concerns - myntet vet sitt eget värde. Vi kan sätta detta värde i konstruktorn när vi skapar mynt, men det är inget krav då vi har ett standardvärde.

## Gränssnittsklass för UI

För att användaren ska kunna se sin score och antal samlade mynt skapar vi en dedikerad `UI` klass för att rita game state på skärmen. Det ger oss en central punkt att utgå ifrån när vi vill lägga till mer UI-element i framtiden (hälsa, power-ups, etc).

```javascript
export default class UserInterface {
    constructor(game) {
        this.game = game
        this.fontSize = 24
        this.fontFamily = 'Arial'
        this.textColor = '#FFFFFF'
        this.shadowColor = '#000000'
    }

    draw(ctx) {
        ctx.save()
        
        // Konfigurera text
        ctx.font = `${this.fontSize}px ${this.fontFamily}`
        ctx.fillStyle = this.textColor
        ctx.shadowColor = this.shadowColor
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        ctx.shadowBlur = 3
        
        // Rita score
        const scoreText = `Score: ${this.game.score}`
        ctx.fillText(scoreText, 20, 40)
        
        // Rita coins collected
        const coinsText = `Coins: ${this.game.coinsCollected}`
        ctx.fillText(coinsText, 20, 70)
        
        ctx.restore()
    }
}
```

Här skapar vi några konfigurationsparameterar för font och färg. I det här fallet så hårdkodar vi värdena i konstruktorn och sätter dem inte från `Game.js` när vi skapar UI-objektet.
Sedan använder vi `draw()` metoden för att rita score och antal mynt på skärmen med canvas `fillText()` funktion.

### Varför en separat UI-klass?

- **Separation of concerns** - UI-logik separerad från game-logik
- **Återanvändbart** - Lätt att utöka med mer UI-element
- **Lättare att styla** - All text-styling på ett ställe

## Make it rain! Skapa mynt i nivån

I `Game.js` konstruktor skapar vi en array med mynt.

```javascript
this.coins = [
    new Coin(this, 200, this.height - 180),
    new Coin(this, 240, this.height - 180),
    new Coin(this, 450, this.height - 240),
    // ... fler mynt
]
```

Mynten placeras strategiskt:
- Vid plattformar
- Mellan plattformar (kräver hopp)
- Olika höjder för variation

## Plocka upp mynt

För att kunna plocka upp mynten så behöver vi titta på kollision mellan spelaren och mynten i `Game.js` `update()` metoden. Vi gör detta i två steg. I det första steget så kontrollerar vi kollision och markerar mynt för borttagning, i nästa steg tar vi bort de markerade mynten.

```javascript
// Kontrollera kollision med mynt
this.coins.forEach(coin => {
    if (this.player.intersects(coin) && !coin.markedForDeletion) {
        // Plocka upp myntet
        this.score += coin.value
        this.coinsCollected++
        coin.markedForDeletion = true
    }
})
```

När vi väl har markerat mynt för borttagning så tar vi bort dem i ett separat steg.

```javascript
// Ta bort alla objekt markerade för borttagning
this.coins = this.coins.filter(coin => !coin.markedForDeletion)
```

Vad är då `array.filter()`? Det är en inbyggd JavaScript-metod som skapar en ny array med alla element som uppfyller ett visst villkor. I detta fall behåller vi bara de mynt som **inte** är markerade för borttagning.
Funktionen itererar över varje element i arrayen och inkluderar det i den nya arrayen om villkoret (`!coin.markedForDeletion`) är sant. Det gör att vi inte ändrar den ursprungliga arrayen medan vi itererar över den, vilket undviker potentiella buggar (fundera på vad som händer om vi iterar med index och tar bort element med index platser samtidigt).

### Varför två steg?

**Separation av logik:**
- Första loopen: Game logic (kollision, score, state changes)
- Andra steget: Cleanup (array management)

**Säkerhet:**
- Vi modifierar aldrig arrayen medan vi itererar över den
- Undviker klassiska bugs med index som förskjuts
- Objekt kan markeras från flera ställen (kollision, timer, off-screen, etc.)

**Flexibilitet:**
- Ett mynt kan markeras från olika håll (pickup, timeout, special event)
- Cleanup sker alltid på samma sätt
- Lätt att lägga till mer cleanup-logik senare

### Varför intersects() och inte getCollisionData()?

För mynt behöver vi bara veta **OM** kollision sker, inte från vilken riktning. `intersects()` är:
- Snabbare (ingen riktningsberäkning)
- Enklare att läsa
- Perfekt för triggers och pickups

## Att rita på canvas och varför ordningen är viktig

När vi ritar alla objekt på canvas i `Game.js` `draw()` metoden är ordningen viktig. Varför? För att ordningen avgör vad som hamnar framför vad visuellt.

```javascript
draw(ctx) {
    this.platforms.forEach(platform => platform.draw(ctx))  // Bakgrund
    this.coins.forEach(coin => coin.draw(ctx))              // Mynt
    this.gameObjects.forEach(obj => obj.draw(ctx))          // Andra objekt
    this.player.draw(ctx)                                   // Spelare
    this.ui.draw(ctx)                                       // UI överst
}
```

## Nu är du redo att samla digital rikedomar!

Nu kan du:
1. **Samla mynt** - Spring/hoppa in i mynt för att plocka upp dem
2. **Se score öka** - Score visas i övre vänstra hörnet
3. **Räkna mynt** - Antal samlade mynt visas också

## Uppgifter

### Silver och guld

Skapa två olika mynttyper med olika värden och färger. Det kan vara guldmynt (värde 50) och silvermynt (värde 10). Du kan antingen sätta olika värden när du skapar mynten i `Game.js`, eller skapa två nya klasser `GoldCoin` och `SilverCoin` som ärver från `Coin` klassen.

### Skriv ut totalt antal mynt i nivån

Lägg till en egenskap i `Game.js` som håller reda på totalt antal mynt i nivån. Uppdatera UI för att visa detta som `Coins: X/Y` där X är samlade mynt och Y är totalt antal mynt. Det gör målet för gameloopen tydligt för spelaren.

### Roterande mynt

Lägg till en roterande animation på mynten för att göra dem mer visuellt tilltalande. Du kan använda `ctx.rotate()` i `Coin.draw()` metoden för att rotera myntet baserat på tid eller en intern räknare.

När du använder en funktion som `ctx.rotate()` måste du spara och återställa canvasens tillstånd med `ctx.save()` och `ctx.restore()` för att undvika att påverka andra ritningar.

```javascript
ctx.save()
// Rotationslogik 
ctx.rotate(angleInRadians)
// Rita myntet här
ctx.restore()
```
## Sammanfattning

Vi har nu tittat på hur du kan fortsätta lära dig mer om hur en spelmotor är uppbyggd genom objektorienterad programmering. Vi fortsätter att utöka vårt grundläggande `GameObject` med egenskaper som `markedForDeletion` för att hantera borttagning av objekt på ett säkert och återanvändbart sätt. Vi skapar sedan objekt i spelvärlden som `Coin` som spelaren kan interagera med.
Vi tittar senda på hur vi kan hålla reda på spelets tillstånd (score, antal mynt) i `Game.js` och visa detta för spelaren med en dedikerad `UI` klass.

### Testfrågor

1. Varför lägger vi till `markedForDeletion` i `GameObject` istället för i varje individuell klass som `Coin`?
2. Förklara skillnaden mellan att markera ett objekt för borttagning och att faktiskt ta bort det. Varför gör vi detta i två separata steg?
3. Vad händer om vi inte kontrollerar `!coin.markedForDeletion` i kollisionslogiken? Ge ett exempel på en potentiell bug.
4. Varför ärver `Coin` från `GameObject` istället för att vara en helt separat klass?
5. Förklara skillnaden mellan `intersects()` och `getCollisionData()`. När använder vi vilket?
6. Varför ritas UI sist i `draw()` metoden? Vad händer om vi ritar den först?
7. Beskriv hela flödet från att spelaren träffar ett mynt till att myntet försvinner. Vilka metoder anropas i vilken ordning?
8. Hur skulle `markedForDeletion` användas för att ta bort projectiles som flyger utanför skärmen? Skriv pseudo-kod.
9. Hur skulle du använda `markedForDeletion` för att ta bort fiender? Vad är skillnaden jämfört med mynt?

## Nästa steg

I nästa steg kan du utforska att lägga till fiender som rör sig runt i spelvärlden och kan skada spelaren vid kollision. Detta kommer att introducera mer komplexa interaktioner och ytterligare game state-hantering, såsom spelarens hälsa och liv.

Byt till `05-enemies` branchen för att fortsätta.

```bash
git checkout 05-enemies
```

Öppna sedan filen [Steg 5 - Fiender](05-enemies.md) för att fortsätta!