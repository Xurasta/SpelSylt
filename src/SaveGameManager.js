/**
 * SaveGameManager - Hanterar sparning och laddning av speldata
 * Använder localStorage för att spara speldata mellan sessioner
 */
export default class SaveGameManager {
    /**
     * Skapar en ny SaveGameManager
     * @param {string} storageKey - Nyckeln att använda i localStorage
     */
    constructor(storageKey = 'game-save-data') {
        this.storageKey = storageKey
    }

    /**
     * Sparar speldata till localStorage
     * @param {Object} gameData - Objektet med data att spara
     * @returns {boolean} True om sparandet lyckades, false annars
     */
    save(gameData) {
        try {
            // Lägg till en timestamp så vi vet när spelet sparades
            const saveData = {
                timestamp: Date.now(),
                ...gameData // Spread operator - kopierar alla properties från gameData
            }
            
            // Konvertera objektet till en JSON-sträng
            const jsonString = JSON.stringify(saveData)
            
            // Spara i localStorage
            localStorage.setItem(this.storageKey, jsonString)
            
            console.log('Game saved successfully!')
            return true
        } catch (error) {
            // localStorage kan kasta fel om:
            // - Utrymmet är fullt
            // - localStorage är blockerat (privacy mode)
            // - JSON serialization misslyckas
            console.error('Failed to save game:', error)
            return false
        }
    }

    /**
     * Laddar sparad speldata från localStorage
     * @returns {Object|null} Sparad data eller null om ingen data finns
     */
    load() {
        try {
            // Hämta JSON-strängen från localStorage
            const jsonString = localStorage.getItem(this.storageKey)
            
            // Om ingen data finns, returnera null
            if (!jsonString) {
                return null
            }
            
            // Konvertera JSON-strängen tillbaka till ett objekt
            const saveData = JSON.parse(jsonString)
            
            console.log('Game loaded successfully!')
            return saveData
        } catch (error) {
            // JSON.parse kan kasta fel om data är korrupt
            console.error('Failed to load game:', error)
            return null
        }
    }

    /**
     * Kollar om det finns sparad data
     * @returns {boolean} True om det finns sparad data
     */
    hasSave() {
        return localStorage.getItem(this.storageKey) !== null
    }

    /**
     * Raderar sparad data
     */
    clear() {
        try {
            localStorage.removeItem(this.storageKey)
            console.log('Save data cleared!')
        } catch (error) {
            console.error('Failed to clear save data:', error)
        }
    }

    /**
     * Hämtar information om den sparade datan (för UI)
     * Användbart för att visa "Continue from Level 2" etc
     * @returns {Object|null} Info-objekt eller null om ingen data finns
     */
    getSaveInfo() {
        const save = this.load()
        if (!save) return null
        
        return {
            timestamp: new Date(save.timestamp).toLocaleString('sv-SE'),
            level: save.currentLevelIndex + 1, // +1 för att levels är 0-indexerade
            score: save.score,
            health: save.health,
            coinsCollected: save.coinsCollected
        }
    }

    /**
     * Debug-metod för att se exakt vad som är sparat
     * Använd i console: game.saveManager.debugPrint()
     */
    debugPrint() {
        const saveData = this.load()
        if (!saveData) {
            console.log('No save data found')
            return
        }
        
        console.log('=== SAVE DATA ===')
        console.table(saveData)
        console.log('=================')
    }
}
