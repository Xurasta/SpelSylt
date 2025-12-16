# Steg 14: Ljud och ljudeffekter

I detta steg lägger vi till ljud i spelet. Vi börjar enkelt med en ljudeffekt när spelaren plockar upp mynt, och lär oss hur man laddar och spelar ljud med Web Audio API. Det är kort och lite kod den här gången med mening att du själv ska se mönstret och förstå hur du kan lägga till det där det behövs.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Web Audio API** - Ladda och spela ljud i webbläsaren
- **Encapsulation** - Låt objekt hantera sina egna ljudeffekter
- **Audio-objekt** - Skapa och återanvända Audio-instanser
- **Separation of Concerns** - Håll ljudlogik i rätt klass

## Problemet - Tyst spel

Hittills har spelet ingen ljudfeedback. När spelaren plockar upp mynt, besegrar fiender, eller hoppar finns ingen auditiv respons. Ljud är viktigt för juice och känsla. Ljud likt bilder kan ge väldigt mycket.

- **Feedback** - Bekräfta att något hände
- **Immersion** - Få spelet att kännas mer levande
- **Game feel** - Göra interaktioner mer tillfredsställande

## Ljud i webbläsaren - Audio API

JavaScript har ett inbyggt `Audio`-objekt för att spela ljud:

```javascript
const sound = new Audio('path/to/sound.mp3')
sound.volume = 0.5 // 0.0 till 1.0
sound.play()
```

**Viktiga metoder och properties:**
- `new Audio(src)` - Skapa ljudobjekt från en fil
- `.play()` - Spela ljudet (returnerar ett Promise)
- `.pause()` - Pausa ljudet
- `.currentTime` - Nuvarande position i sekunder (kan sättas)
- `.volume` - Volym från 0.0 (tyst) till 1.0 (max)

> 🛟 Att spela ljud i webbläsaren är inte alltid helt problemfritt. Se till att ljud spelas efter att användaren "gjort" något, inte direkt när sidan laddas. Detta eftersom auto-play är blockerat.

## Klassen ska hantera sitt eget ljud

I det här fallet så ska vi spela ljud från `Coin.js` när det plockas upp. Det är alltså `Coin.js` som ansvarar för att spela ljudet, inte `PlatformerGame.js`. 

```javascript
// Coin.js
this.sound = new Audio(...)
// Vid upphämtning:
this.collect() // Spelar ljud inuti metoden
```

## Implementera ljud i Coin

### Ladda ljudfilen med Vite

Först importerar vi ljudfilen i `Coin.js`, på samma sätt som vi importerar bilder:

```javascript
import GameObject from './GameObject.js'
import dingSound from './assets/sounds/ding-402325.mp3'

export default class Coin extends GameObject {
    constructor(game, x, y, size = 20, value = 10) {
        super(game, x, y, size, size)
        this.size = size
        this.color = 'yellow'
        this.value = value
        
        // Bob animation
        this.bobOffset = 0
        this.bobSpeed = 0.006
        this.bobDistance = 5
        
        // Sound
        this.sound = new Audio(dingSound)
        this.sound.volume = 0.3 // Sänk volymen lite
    }
    
    // ... resten av klassen
}
```

### Viktiga delar

#### Import med Vite

```javascript
import dingSound from './assets/sounds/ding-402325.mp3'
```

Precis som med bilder använder vi Vite's import-system. Vite hanterar filvägen och optimerar assets automatiskt.

> 🎮 Detta trista ding-ljud är bara ett exempel och en start. Ge dig ut och leta, använd AI eller spela in egan ljud med telefonen. Uppenbarligen behöver vi någon som skriker "boing" när vi hoppar eller "ouch" när vi tar skada?

#### Audio-instans per mynt

```javascript
this.sound = new Audio(dingSound)
this.sound.volume = 0.3
```

Varje mynt får sin egen `Audio`-instans. Detta låter oss spela samma ljud flera gånger samtidigt (om spelaren plockar upp många mynt snabbt). Volymen sätts till 0.3 (30%) för att inte vara för högljudd.

### Skapa collect() metod

Nu lägger vi till en `collect()`-metod som hanterar upphämtning. Anledningen till att skapa en separat metod är att kapsla in all logik för upphämtning på ett ställe.

```javascript
collect() {
    this.markedForDeletion = true
    // Spela ljud
    this.sound.currentTime = 0 // Reset så det kan spelas flera gånger snabbt
    this.sound.play().catch(e => console.log('Coin sound play failed:', e))
}
```

#### currentTime = 0

```javascript
this.sound.currentTime = 0
```

Om ljudet redan spelar och vi anropar `play()` igen händer ingenting. Genom att återställa `currentTime` till 0 kan vi spela ljudet från början även om det redan spelas. Detta är viktigt om spelaren plockar upp flera mynt snabbt efter varandra.

#### .play().catch()

```javascript
this.sound.play().catch(e => console.log('Coin sound play failed:', e))
```

`play()` returnerar ett Promise som kan misslyckas om:
- Webbläsaren blockerar autoplay (användaren måste interagera först)
- Ljudfilen inte laddades korrekt
- Audio context är suspenderad

`.catch()` fångar felet och loggar det istället för att krascha spelet.

## Uppdatera PlatformerGame.js

Nu behöver vi bara anropa `collect()` istället för att manuellt sätta `markedForDeletion`:

```javascript
// PlatformerGame.js - i update()
// Kontrollera kollision med mynt
this.coins.forEach(coin => {
    if (this.player.intersects(coin) && !coin.markedForDeletion) {
        // Plocka upp myntet
        this.score += coin.value
        this.coinsCollected++
        coin.collect() // Myntet hanterar sin egen ljud och markering
    }
})
```

## Varför är detta bra design?

### 1. Encapsulation
Myntet äger sin egen ljud-feedback. Om vi vill ändra ljudet behöver vi bara redigera `Coin.js`, inte leta genom `PlatformerGame.js` efter alla ställen där mynt plockas upp.

### 2. Single Responsibility
- `Coin` ansvarar för myntbeteende (animation, ljud, upphämtning)
- `PlatformerGame` ansvarar för kollisionsdetektering och poäng

### 3. Lätt att utöka

**Exempel: Olika mynttyper med olika ljud**
```javascript
class GoldCoin extends Coin {
    constructor(game, x, y) {
        super(game, x, y, 30, 50)
        this.color = 'gold'
        this.sound = new Audio(goldCoinSound) // Eget ljud!
    }
}
```

Ingen ändring i `PlatformerGame.js` behövs!

### 4. Följer GameObject-mönstret

Precis som GameObject har `update()` och `draw()`, har Coin nu `collect()`. Varje objekt hanterar sin egen state och beteende.

## Uppgifter

### Mera ljud

Klart det behövs ett klassiskt "uff"-ljud när spelaren hoppar! Lägg till ett hopp-ljud i `Player.js` som spelas varje gång spelaren hoppar.

**Jump-ljud i Player.js:**
```javascript
// Player.js
import jumpSound from './assets/sounds/jump.mp3'

constructor(...) {
    // ...
    this.jumpSound = new Audio(jumpSound)
    this.jumpSound.volume = 0.2
}

// I input-hantering:
if (keys.has(' ') && this.isGrounded) {
    this.velocityY = this.jumpPower
    this.jumpSound.currentTime = 0
    this.jumpSound.play().catch(e => {})
}
```
#### Skade-ljud

Använd samma mönster för att lägga till ett ljud när spelaren träffas av en fiende.

#### Pew-pew

Lägg till ett skjut-ljud i `Projectile.js` som spelas varje gång en projektil skjuts iväg.

### Bakgrundsmusik

Inget spel är komplett utan bakgrundsmusik! Lägg till en loopande musik som spelas i bakgrunden under spelet.

För att loopa ljudet så sätter du `audio.loop = true`:

```javascript
const bgMusic = new Audio(backgroundMusicPath)
bgMusic.volume = 0.1
bgMusic.loop = true
bgMusic.play().catch(e => {})
```

### Audio Manager (Avancerat)

För större spel kan du skapa en `AudioManager`-klass som hanterar:
- Volymkontroller (master, sfx, music)
- Ljudpooling (återanvänd Audio-objekt)
- Mute-funktionalitet
- Bakgrundsmusik med looping

```javascript
class AudioManager {
    constructor() {
        this.sounds = new Map()
        this.volume = 1.0
        this.muted = false
    }
    
    load(name, path) {
        this.sounds.set(name, new Audio(path))
    }
    
    play(name) {
        if (this.muted) return
        const sound = this.sounds.get(name)
        if (sound) {
            sound.currentTime = 0
            sound.volume = this.volume
            sound.play().catch(e => {})
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume))
    }
    
    toggleMute() {
        this.muted = !this.muted
    }
}
```

### Testfrågor

1. Varför skapar vi en ny `Audio`-instans i Coin's constructor istället för att dela en global?
2. Vad händer om vi glömmer `sound.currentTime = 0` innan vi spelar ljudet igen?
3. Varför använder vi `.catch()` på `play()`-Promise?
4. Förklara varför `coin.collect()` är bättre än att sätta `coin.markedForDeletion = true` direkt i PlatformerGame.js
5. Vad är skillnaden mellan `volume = 0.3` och `volume = 0.5`?
6. Varför importerar vi ljudfilen med `import` istället för bara en sträng med filvägen?
7. Hur skulle du implementera en mute-funktion som stänger av alla ljud?

## Nästa steg