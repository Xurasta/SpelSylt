import GameBase from './GameBase.js'
import Player from './Player.js'
import Projectile from './Projectile.js'
import Level1 from './levels/Level1.js'
import Level2 from './levels/Level2.js'
import MainMenu from './menus/MainMenu.js'
import SaveGameManager from './SaveGameManager.js'

/**
 * PlatformerGame - En konkret implementation av GameBase för plattformsspel
 * Innehåller plattformsspel-specifik logik som gravity, platforms, coins
 * Använder Level-system för att hantera olika nivåer
 */
export default class PlatformerGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        // Plattformsspel behöver en större värld för sidoscrolling
        this.worldWidth = width * 3
        this.worldHeight = height
        this.camera.setWorldBounds(this.worldWidth, this.worldHeight)
        
        // Plattformsspel-specifik fysik
        this.gravity = 0.001 // pixels per millisekund^2
        this.friction = 0.00015 // luftmotstånd för att bromsa fallhastighet

        // Plattformsspel-specifik state
        this.coinsCollected = 0
        this.totalCoins = 0 // Sätts när vi skapar coins
        
        // Level management
        this.currentLevelIndex = 0
        this.levels = [Level1, Level2] // Array av level-klasser
        this.currentLevel = null
        
        // Plattformsspel-specifika arrays
        this.platforms = []
        this.coins = []
        this.projectiles = []
        
        // Background arrays (sätts av levels)
        this.backgrounds = []
        this.backgroundObjects = []
        
        // Save game system
        this.saveManager = new SaveGameManager('platformer-save')
        
        // Initiera spelet
        this.init()
        
        // Skapa och visa huvudmenyn
        this.currentMenu = new MainMenu(this)
    }
    
    init() {
        // Återställ score (men inte game state - det hanteras av constructor/restart)
        this.score = 0
        this.coinsCollected = 0
        
        // Återställ camera
        this.camera.x = 0
        this.camera.y = 0
        this.camera.targetX = 0
        this.camera.targetY = 0

        // Ladda current level
        this.loadLevel(this.currentLevelIndex)
    }
    
    loadLevel(levelIndex) {
        // Säkerställ att level index är giltigt
        if (levelIndex < 0 || levelIndex >= this.levels.length) {
            console.error(`Level ${levelIndex} finns inte`)
            return
        }
        
        // Skapa ny level instance
        const LevelClass = this.levels[levelIndex]
        this.currentLevel = new LevelClass(this)
        
        // Hämta level data
        const levelData = this.currentLevel.getData()
        
        // Sätt level data
        this.platforms = levelData.platforms
        this.coins = levelData.coins
        this.enemies = levelData.enemies
        this.totalCoins = this.coins.length
        
        // Sätt background data
        this.backgrounds = levelData.backgrounds
        this.backgroundObjects = levelData.backgroundObjects
        
        // Återställ mynt-räknare för denna level
        this.coinsCollected = 0
        
        // Skapa player på level spawn position
        this.player = new Player(
            this, 
            levelData.playerSpawnX, 
            levelData.playerSpawnY, 
            50, 50, 'green'
        )
        
        // Återställ projektiler
        this.projectiles = []
        
        // Återställ camera för ny level
        this.camera.x = 0
        this.camera.y = 0
        this.camera.targetX = 0
        this.camera.targetY = 0
    }
    
    nextLevel() {
        this.currentLevelIndex++
        
        // Kolla om det finns fler levels
        if (this.currentLevelIndex >= this.levels.length) {
            // Inga fler levels - spelet är klart!
            this.gameState = 'WIN'
            return
        }
        
        // Ladda nästa level
        this.loadLevel(this.currentLevelIndex)
        this.gameState = 'PLAYING'
    }
    
    addProjectile(x, y, directionX) {
        const projectile = new Projectile(this, x, y, directionX)
        this.projectiles.push(projectile)
    }
    
    restart() {
        this.currentLevelIndex = 0
        this.init()
        this.gameState = 'PLAYING'
        this.currentMenu = null
    }
    
    /**
     * Sparar nuvarande spelläge
     */
    saveGame() {
        // Kolla att spelaren finns (kan inte spara om spelet inte har startat)
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
    
    /**
     * Laddar sparat spelläge
     * @returns {boolean} True om laddning lyckades
     */
    loadGame() {
        const saveData = this.saveManager.load()
        if (!saveData) {
            console.warn('No save data found')
            return false
        }
        
        // Ladda level först
        this.currentLevelIndex = saveData.currentLevelIndex
        this.loadLevel(this.currentLevelIndex)
        
        // Återställ spelarens position och hälsa
        this.player.x = saveData.playerX
        this.player.y = saveData.playerY
        this.player.health = saveData.health
        
        // Återställ progress
        this.score = saveData.score
        this.coinsCollected = saveData.coinsCollected
        
        // Starta spelet
        this.gameState = 'PLAYING'
        this.currentMenu = null
        
        console.log('Game loaded!')
        return true
    }

    update(deltaTime) {
        // Uppdatera menyn om den är aktiv
        if (this.gameState === 'MENU' && this.currentMenu) {
            this.currentMenu.update(deltaTime)
            this.inputHandler.keys.clear() // Rensa keys så de inte läcker till spelet
            return
        }
        
        // Kolla Escape för att öppna menyn under spel
        if (this.inputHandler.keys.has('Escape') && this.gameState === 'PLAYING') {
            this.gameState = 'MENU'
            this.currentMenu = new MainMenu(this)
            return
        }
        
        // Kolla restart input
        if (this.inputHandler.keys.has('r') || this.inputHandler.keys.has('R')) {
            if (this.gameState === 'GAME_OVER' || this.gameState === 'WIN') {
                this.restart()
                return
            }
        }
        
        // Debug: Byt level med N-tangenten (för testning)
        if (this.inputHandler.keys.has('n') || this.inputHandler.keys.has('N')) {
            // Ta bort tangenten så den inte triggas flera gånger
            this.inputHandler.keys.delete('n')
            this.inputHandler.keys.delete('N')
            
            // Gå till nästa level (loopa runt om nödvändigt)
            this.currentLevelIndex = (this.currentLevelIndex + 1) % this.levels.length
            this.loadLevel(this.currentLevelIndex)
            this.gameState = 'PLAYING'
            return
        }
        
        // Spara spelet med S-tangenten (endast när spelet körs)
        if ((this.inputHandler.keys.has('s') || this.inputHandler.keys.has('S')) && this.gameState === 'PLAYING') {
            // Ta bort tangenten så den inte triggas flera gånger
            this.inputHandler.keys.delete('s')
            this.inputHandler.keys.delete('S')
            
            this.saveGame()
            return
        }
        
        // Uppdatera bara om spelet är i PLAYING state
        if (this.gameState !== 'PLAYING') return
        
        // Uppdatera background objects
        this.backgroundObjects.forEach(obj => obj.update(deltaTime))
        
        // Uppdatera plattformar (även om de är statiska)
        this.platforms.forEach(platform => platform.update(deltaTime))
        
        // Uppdatera mynt (plattformsspel-specifikt)
        this.coins.forEach(coin => coin.update(deltaTime))
        
        // Uppdatera fiender (med plattformsfysik)
        this.enemies.forEach(enemy => enemy.update(deltaTime))
        
        // Uppdatera spelaren
        this.player.update(deltaTime)

        // Antag att spelaren inte står på marken, tills vi hittar en kollision
        this.player.isGrounded = false

        // Kontrollera kollisioner med plattformar
        this.platforms.forEach(platform => {
            this.player.handlePlatformCollision(platform)
        })

        // Kontrollera kollisioner för fiender med plattformar
        this.enemies.forEach(enemy => {
            enemy.isGrounded = false
            
            this.platforms.forEach(platform => {
                enemy.handlePlatformCollision(platform)
            })
            
            // Vänd vid world bounds istället för screen bounds
            enemy.handleScreenBounds(this.worldWidth)
        })
        
        // Kontrollera kollisioner mellan fiender
        this.enemies.forEach((enemy, index) => {
            this.enemies.slice(index + 1).forEach(otherEnemy => {
                enemy.handleEnemyCollision(otherEnemy)
                otherEnemy.handleEnemyCollision(enemy)
            })
        })

        // Kontrollera kollision med mynt
        this.coins.forEach(coin => {
            if (this.player.intersects(coin) && !coin.markedForDeletion) {
                // Plocka upp myntet
                this.score += coin.value
                this.coinsCollected++
                coin.collect() // Myntet hanterar sin egen ljud och markering
            }
        })
        
        // Kontrollera kollision med fiender
        this.enemies.forEach(enemy => {
            if (this.player.intersects(enemy) && !enemy.markedForDeletion) {
                // Spelaren tar skada
                this.player.takeDamage(enemy.damage)
            }
        })
        
        // Uppdatera projektiler
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime)
            
            // Kolla kollision med fiender
            this.enemies.forEach(enemy => {
                if (projectile.intersects(enemy) && !enemy.markedForDeletion) {
                    enemy.markedForDeletion = true
                    projectile.markedForDeletion = true
                    this.score += enemy.points || 50 // Använd enemy.points om det finns, annars 50
                }
            })
            
            // Kolla projektil-kollision med plattformar (plattformsspel-specifikt)
            this.platforms.forEach(platform => {
                if (projectile.intersects(platform)) {
                    projectile.markedForDeletion = true
                }
            })
        })
        
        // Ta bort objekt markerade för borttagning
        this.coins = this.coins.filter(coin => !coin.markedForDeletion)
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion)
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion)

        // Förhindra att spelaren går utöver world bounds
        if (this.player.x < 0) {
            this.player.x = 0
        }
        if (this.player.x + this.player.width > this.worldWidth) {
            this.player.x = this.worldWidth - this.player.width
        }
        
        // Uppdatera kameran för att följa spelaren
        this.camera.follow(this.player)
        this.camera.update(deltaTime)
        
        // Kolla win condition - alla mynt samlade
        if (this.coinsCollected === this.totalCoins && this.gameState === 'PLAYING') {
            // Gå till nästa level
            this.nextLevel()
        }
        
        // Kolla lose condition - spelaren är död
        if (this.player.health <= 0 && this.gameState === 'PLAYING') {
            this.gameState = 'GAME_OVER'
        }
    }

    draw(ctx) {
        // Rita backgrounds FÖRST (längst bak)
        this.backgrounds.forEach(bg => bg.draw(ctx, this.camera))
        
        // Rita background objects
        this.backgroundObjects.forEach(obj => {
            if (this.camera.isVisible(obj)) {
                obj.draw(ctx, this.camera)
            }
        })
        
        // Rita alla plattformar med camera offset
        this.platforms.forEach(platform => {
            if (this.camera.isVisible(platform)) {
                platform.draw(ctx, this.camera)
            }
        })
        
        // Rita mynt med camera offset
        this.coins.forEach(coin => {
            if (this.camera.isVisible(coin)) {
                coin.draw(ctx, this.camera)
            }
        })
        
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
        
        // Rita spelaren med camera offset
        this.player.draw(ctx, this.camera)
        
        // Rita UI sist (utan camera offset - alltid synligt)
        this.ui.draw(ctx)
        
        // Rita meny överst om den är aktiv
        if (this.currentMenu) {
            this.currentMenu.draw(ctx)
        }
    }
}