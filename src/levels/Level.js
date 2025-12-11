/**
 * Abstract base class för alla levels
 * Innehåller level-specifik data som plattformar, mynt, fiender
 * Subklasser (Level1, Level2, etc) definierar konkreta level layouts
 */
export default class Level {
    constructor(game) {
        // Förhindra direkt instansiering av Level
        if (new.target === Level) {
            throw new Error('Level är en abstract class och kan inte instansieras direkt')
        }

        this.game = game
        
        // Level data - ska fyllas i av subklasser
        this.platforms = []
        this.coins = []
        this.enemies = []
        
        // Player spawn position
        this.playerSpawnX = 50
        this.playerSpawnY = 50
    }

    /**
     * Abstract method - måste implementeras av subklasser
     * Skapar plattformar för leveln
     */
    createPlatforms() {
        throw new Error('createPlatforms() måste implementeras av subklass')
    }

    /**
     * Abstract method - måste implementeras av subklasser
     * Skapar mynt för leveln
     */
    createCoins() {
        throw new Error('createCoins() måste implementeras av subklass')
    }

    /**
     * Abstract method - måste implementeras av subklasser
     * Skapar fiender för leveln
     */
    createEnemies() {
        throw new Error('createEnemies() måste implementeras av subklass')
    }

    /**
     * Initierar leveln - anropar alla create-metoder
     */
    init() {
        this.createPlatforms()
        this.createCoins()
        this.createEnemies()
    }

    /**
     * Hämtar all level data som ett objekt
     */
    getData() {
        return {
            platforms: this.platforms,
            coins: this.coins,
            enemies: this.enemies,
            playerSpawnX: this.playerSpawnX,
            playerSpawnY: this.playerSpawnY
        }
    }
}
