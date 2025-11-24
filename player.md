# Player

I den här delen så skapar vi en `Player`-klass som ärver från `GameObject`. Denna klass representerar spelaren i spelet och hanterar dess rörelse och rendering.

Klassen använder `InputHandler` för att läsa av tangentbordsinput och uppdatera spelarens position baserat på detta.

## Konstruktor

Konstruktorn tar emot `game`-instansen samt position och storlek för spelaren. Den initierar även hastighet och riktning.

```javascript
    constructor(game, x, y, width, height, color) {
        super(game, x, y, width, height)
        this.color = color
        
        // Nuvarande hastighet (pixels per millisekund)
        this.velocityX = 0
        this.velocityY = 0

        // Rörelsehastighet (hur snabbt spelaren accelererar/rör sig)
        this.moveSpeed = 0.5
        this.directionX = 0
        this.directionY = 0
    }
```

Inget jättekonstigt, vi sätter egenskaper för färg, hastighet och riktning.

## Uppdateringsmetod

I uppdateringsmetoden så händer det en hel del. Vi kollar vilka tangenter som är nedtryckta och uppdaterar spelarens hastighet och riktning baserat på detta. Utifrån det här sätter vi även en variabel för spelarens riktning. Det kan användas för bland annat att rita ut ögon som "tittar" i den riktningen spelaren rör sig, men det är även användbart för andra saker som animationer, attacker med mera.

```javascript
    update(deltaTime) {
        // Kolla input för rörelse
        if (this.game.input.isKeyPressed('ArrowUp')) {
            this.velocityY = -this.moveSpeed
            this.directionY = -1
        } else if (this.game.input.isKeyPressed('ArrowDown')) {
            this.velocityY = this.moveSpeed
            this.directionY = 1
        } else {
            this.velocityY = 0
            this.directionY = 0
        }

        if (this.game.input.isKeyPressed('ArrowLeft')) {
            this.velocityX = -this.moveSpeed
            this.directionX = -1
        } else if (this.game.input.isKeyPressed('ArrowRight')) {
            this.velocityX = this.moveSpeed
            this.directionX = 1
        } else {
            this.velocityX = 0
            this.directionX = 0
        }
        
        // Uppdatera position baserat på hastighet
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
    }
```

Som du ser är hanteringen av input och rörelsen ganska likadan. Vi kollar om en viss tangent är nedtryckt, och om den är det så sätter vi hastigheten i den riktningen. Om ingen tangent är nedtryckt så sätter vi hastigheten till 0. Fundera här varför vi hanterar rörelsen i två separata if-satser istället för att använda `else if` för både X- och Y-rörelsen.

Slutligen uppdaterar vi spelarens position baserat på hastigheten och `deltaTime`. Det är för att göra rörelsen framerate-oberoende.

Här skulle vi också kunna göra så att spelaren accelerar och bromsar in mjukt, något som ger en väldigt annorlunda känsla jämfört med den direkta rörelsen vi har nu.

### Stoppa spelaren från att gå utanför canvas

Om du vill kan du lägga till kod för att stoppa spelaren från att gå utanför canvasens gränser. Lägg till följande kod i slutet av `update`-metoden men innan vi uppdaterar positionen för spelaren.

```javascript
// stoppa från att gå utanför canvas
if (this.x < 0) this.x = 0
if (this.x + this.width > this.game.width) this.x = this.game.width - this.width
if (this.y < 0) this.y = 0
if (this.y + this.height > this.game.height) this.y = this.game.height - this.height
```

## Renderingsmetod

I draw så ritar vi ut spelaren som en rektangel. Detta sker likadant som i `Rectangle`-klassen vi skapade tidigare. Men här så lägger vi även till ögon som "tittar" i den riktning spelaren rör sig. Detta för att ge spelaren karaktär.

```javascript
    draw(ctx) {
        // Rita spelaren som en rektangel
        ctx.fillStyle = this.color
        ctx.fillRect(this.x, this.y, this.width, this.height)

        // Rita ögon
        ctx.fillStyle = 'white'
        ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.2, this.width * 0.2, this.height * 0.2)
        ctx.fillRect(this.x + this.width * 0.6, this.y + this.height * 0.2, this.width * 0.2, this.height * 0.2)
        
        // Rita pupiller
        ctx.fillStyle = 'black'
        ctx.fillRect(
            this.x + this.width * 0.25 + this.directionX * this.width * 0.05, 
            this.y + this.height * 0.25 + this.directionY * this.width * 0.05, 
            this.width * 0.1, 
            this.height * 0.1
        )
        ctx.fillRect(
            this.x + this.width * 0.65 + this.directionX * this.width * 0.05, 
            this.y + this.height * 0.25 + this.directionY * this.width * 0.05, 
            this.width * 0.1, 
            this.height * 0.1
        )
        
        // rita mun som ett streck
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.65)
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.65)
        ctx.stroke()
    }
```

### Rita mun

I slutet av `draw`-metoden så ritar vi även en mun som ett streck. Detta gör vi med hjälp av `beginPath`, `moveTo`, `lineTo` och `stroke`-metoderna på canvas-kontexten.

```javascript
        // rita mun som ett streck
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.65)
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.65)
        ctx.stroke()
```

Detta ger spelaren ett enkelt ansikte med ögon och mun, vilket gör den mer levande och karaktärsfull. Men hur skulle vi kunna göra munnen mer uttrycksfull?

#### Glad och ledsen mun

Exprimentera med ritmetoderna för att göra munnen glad eller ledsen. Testa att styra det med inputs, eller varför inte göra spelaren ledsen när den inte rör sig?

## Uppgifter

### Rektanglar och kollision

Nu kan du testa att rita flera rektanglar på canvasen och låta spelaren röra sig runt bland dem. I `GameObject`-klassen finns det redan en metod för att kolla kollision mellan två objekt. Använd denna för att göra så att spelaren inte kan gå igenom rektanglarna. I det här fallet så är det rekommenderat att kontrollera kollision i `Game`-klassens `update`-metod, där du kan iterera över alla `gameObjects` och kolla om spelaren kolliderar med någon av dem.

**Viktigt:** Spelaren ska lagras separat från `gameObjects`-arrayen i `Game`-klassen. Detta gör det enklare att hantera spelaren separat från andra objekt:

```javascript
// I Game.js constructor
this.player = new Player(this, 50, 50, 50, 50, 'green')

this.gameObjects = [
    new Rectangle(this, 200, 150, 50, 50, 'red')
]
```

Sedan i `update`-metoden kollar vi kollision mellan spelaren och alla andra objekt:

```javascript
// Game.js update()
this.player.update(deltaTime)
this.gameObjects.forEach(obj => obj.update(deltaTime))

this.gameObjects.forEach(obj => {
    if (this.player.intersects(obj)) {
        // Hantera kollision, tex. rita en sur mun och stoppa rörelsen
    }
})
```

Vi låter alltså `Game`-klassen hantera kollisionsdetekteringen, vilket är en bra designprincip eftersom `Game` har överblick över alla objekt i spelet.

#### Stoppa spelaren vid kollision

När spelaren väl kolliderar med ett objekt så behöver vi hantera det, till exempel genom att stoppa spelarens rörelse i den riktningen. Detta kan göras genom att justera spelarens position baserat på vilken sida kollisionsdetekteringen inträffade på. Vi använder `directionX` och `directionY` för att bestämma åt vilket håll spelaren rör sig:

```javascript
// Game.js update()
this.gameObjects.forEach(obj => {
    if (this.player.intersects(obj)) {
        // Hantera kollision baserat på riktning
        if (this.player.directionX > 0) { // rör sig åt höger
            this.player.x = obj.x - this.player.width
        } else if (this.player.directionX < 0) { // rör sig åt vänster
            this.player.x = obj.x + obj.width
        }
        if (this.player.directionY > 0) { // rör sig neråt
            this.player.y = obj.y - this.player.height
        } else if (this.player.directionY < 0) { // rör sig uppåt
            this.player.y = obj.y + obj.height
        }
    }
})
```

Och i `draw`-metoden ritar vi spelaren separat:

```javascript
// Game.js draw()
draw(ctx) {
    this.gameObjects.forEach(obj => obj.draw(ctx))
    this.player.draw(ctx)
}
```

Testa detta och se hur det fungerar! Justera gärna koden för att få det att kännas rätt i spelet.

## Sammanfattning

I den här filen har vi skapat en `Player`-klass som hanterar spelarens rörelse och rendering. Vi har använt `InputHandler` för att läsa av tangentbordsinput och uppdaterat spelarens position baserat på detta.

Du har nu en grund för att skapa ett spel där spelaren kan röra sig runt på canvasen.

