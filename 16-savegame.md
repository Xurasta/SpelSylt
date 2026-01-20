# 16 - Save Game System

I denna del implementerar vi ett enkelt men kraftfullt save game-system som använder webbläsarens localStorage för att spara spelframsteg. Detta är ett utmärkt exempel på hur man kan lagra data lokalt i en webbapplikation.

## Koncept

### localStorage API
- Webbläsarens inbyggda lagringsmekanism
- Persistent lagring (data finns kvar efter att sidan stängs)
- Key-value storage (nyckel-värde lagring), `savegame: data`
- Synkron API (inget behov av async/await)
- Cirka 5-10 MB lagringsutrymme per domän

### JSON Serialization
- Konvertering av JavaScript-objekt till strängar
- `JSON.stringify()` - objekt sträng
- `JSON.parse()` - sträng objekt
- Endast data sparas, inte funktioner eller metoder

### State Management
- Vilken data definierar ett spelläge?
- Minimera datamängden som sparas
- Balans mellan enkelhet och komplettering

## Implementation

### SaveGameManager Class

Vi har skapat en dedikerad klass `SaveGameManager.js` som hanterar all save/load-logik. I exemplet så är det inbyggt en hel del extra funktionalitet för att göra det mer robust och användarvänligt. Om du ska göra en egen i all enkelhet kan du fokusera på att till exempel bara kunna spara och ladda spelarens x och y position samt level index.

```javascript
export default class SaveGameManager {
    constructor(storageKey = 'game-save-data') {
        this.storageKey = storageKey
    }

    save(gameData) { /* ... */ }
    load() { /* ... */ }
    hasSave() { /* ... */ }
    clear() { /* ... */ }
    getSaveInfo() { /* ... */ }
}
```

### Vad Sparas?

Vår save game-data inkluderar:

```javascript
{
    timestamp: Date.now(),           // När sparades spelet?
    currentLevelIndex: 0,            // Vilken level?
    score: 1000,                     // Poäng
    coinsCollected: 5,               // Antal mynt samlade på leveln
    health: 2,                       // Spelarens hälsa
    playerX: 450,                    // Spelarens position
    playerY: 300
}
```

> 🎮 Notera att systemet just nu är lite wonky, när vi laddar om ett save spawnar alla saker på nytt eftersom vi inte sparar den informationen, det gör att någon tekniskt sett kan ladda om för att farma fiender för score.

### Integration i PlatformerGame

Vi har lagt till två huvudmetoder:

#### saveGame()

För att spara spelet:

```javascript
saveGame() {
    if (!this.player) {
        console.warn('Cannot save: game not started')
        return false
    }
    
    return this.saveManager.save({
        currentLevelIndex: this.currentLevelIndex,
        score: this.score,
        coinsCollected: this.coinsCollected,
        health: this.player.health,
        playerX: this.player.x,
        playerY: this.player.y
    })
}
```

#### loadGame()

För att ladda ett sparat spel:

```javascript
loadGame() {
    const saveData = this.saveManager.load()
    if (!saveData) return false
    
    // Ladda level
    this.currentLevelIndex = saveData.currentLevelIndex
    this.loadLevel(this.currentLevelIndex)
    
    // Återställ player state
    this.player.x = saveData.playerX
    this.player.y = saveData.playerY
    this.player.health = saveData.health
    
    // Återställ progress
    this.score = saveData.score
    this.coinsCollected = saveData.coinsCollected
    
    this.gameState = 'PLAYING'
    this.currentMenu = null
    return true
}
```

### Uppdaterad MainMenu

Huvudmenyn har uppdaterats för att dynamiskt visa olika alternativ beroende på om sparad data finns:

**Med sparad data:**
- Continue (Level X) - Ladda sparat spel
- New Game - Starta från början
- Controls - Visa kontroller
- Delete Save - Radera sparad data

**Utan sparad data:**
- Start Game - Starta nytt spel
- Controls - Visa kontroller

## Användning

### För Spelaren

1. **Spara spelet**: Tryck `S` under spel
2. **Fortsätt spel**: Välj "Continue" i huvudmenyn
3. **Starta nytt**: Välj "New Game" (raderar inte save)
4. **Radera save**: Välj "Delete Save" i menyn

### För Utvecklaren

```javascript
// Spara manuellt
game.saveGame()

// Ladda sparat spel
game.loadGame()

// Kolla om save finns
if (game.saveManager.hasSave()) {
    const info = game.saveManager.getSaveInfo()
    console.log(`Save from level ${info.level}`)
}

// Radera save
game.saveManager.clear()

// Debug - visa sparad data
game.saveManager.debugPrint()
```

## Fördelar med Denna Design

### Modulär
- SaveGameManager är helt självständig
- Kan användas i andra spel
- Lätt att testa separat

### Enkel Integration
- Endast 3 integrationer behövdes:
  1. Skapa SaveGameManager i PlatformerGame
  2. Lägg till saveGame() och loadGame() metoder
  3. Uppdatera MainMenu, vilket vi egentligen kan skippa och bara köra quick-save/load med tangenter

### Utbyggbar
- Lätt att lägga till fler fält
- Kan utökas till multiple save slots
- Kan lägga till auto-save funktionalitet

## Begränsningar

För att hålla systemet enkelt gör vi några begränsningar:

- **En save slot**: Endast en sparning åt gången
- **Respawning objects**: Fiender och mynt återställs vid load
- **Basic state**: Sparar inte allt (t.ex. projektiler, animationer)

Dessa begränsningar gör systemet lättare att förstå och implementera.

## Framtida Förbättringar

Här finns det såklart massor att jobba med för att göra systemet mer komplett och förbättrat:

1. **Flera save slots**
   ```javascript
   new SaveGameManager('save-slot-1')
   new SaveGameManager('save-slot-2')
   ```

2. **Auto spara när en ny karta laddas**

Det här kan ersätta den manuella save/load, det blir som checkpoints och vi kan välja att ladda från senaste checkpoint i menyn.

   ```javascript
   // Spara automatiskt när level klaras
   nextLevel() {
       this.saveGame() // Auto-save
       // ... resten av koden
   }
   ```

3. **Spara uppsamlade mynt**

För att göra detta så behöver vi spara en lista med vilka mynt som är uppsamlade och vid load ta bort dem från scenen.

   ```javascript
   // Spara vilka mynt som är uppsamlade
   save({
       collectedCoinIds: [0, 2, 5, 7] // Mynt med dessa index är borta
   })
   ```

## Felhantering

SaveGameManager hanterar vanliga fel:

```javascript
try {
    localStorage.setItem(key, value)
} catch (error) {
    // localStorage kan vara:
    // - Fullt (quota exceeded)
    // - Blockerat (privacy mode)
    // - Korrupt data (JSON parse error)
    console.error('Failed to save:', error)
    return false
}
```

## Testa Systemet

### I Webbläsaren

1. Öppna DevTools (F12)
2. Gå till Application → Local Storage
3. Se din sparade data
4. Testa att manuellt ändra värden
5. Ladda om sidan och se att data finns kvar

