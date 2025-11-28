import Player from './Player.js'
import InputHandler from './InputHandler.js'
import Platform from './Platform.js'
import Coin from './Coin.js'
import Enemy from './Enemy.js'
import UserInterface from './UserInterface.js'

export default class Game {
    constructor(width, height) {
        this.width = width
        this.height = height

        // Fysik
        this.gravity = 0.001 // pixels per millisekund^2
        this.friction = 0.00015 // luftmotstånd för att bromsa fallhastighet

        // Game state
        this.gameState = 'PLAYING' // PLAYING, GAME_OVER, WIN
        this.score = 0
        this.coinsCollected = 0
        this.totalCoins = 0 // Sätts när vi skapar coins

        this.inputHandler = new InputHandler(this)
        this.ui = new UserInterface(this)
        
        // Initiera spelet
        this.init()

        this.inputHandler = new InputHandler(this)
        this.ui = new UserInterface(this)
        
        // Initiera spelet
        this.init()
    }
    
    init() {
        // Återställ game state
        this.gameState = 'PLAYING'
        this.score = 0
        this.coinsCollected = 0

        this.player = new Player(this, 50, 50, 50, 50, 'green')

        // Skapa plattformar för nivån
        this.platforms = [
            // Marken
            new Platform(this, 0, this.height - 40, this.width, 40, '#654321'),
            
            // Plattformar
            new Platform(this, 150, this.height - 140, 150, 20, '#8B4513'),
            new Platform(this, 400, this.height - 200, 120, 20, '#8B4513'),
            new Platform(this, 100, this.height - 280, 100, 20, '#8B4513'),
            new Platform(this, 550, this.height - 160, 100, 20, '#8B4513'),
            new Platform(this, 350, this.height - 320, 140, 20, '#8B4513'),
        ]

        // Skapa mynt i nivån
        this.coins = [
            new Coin(this, 200, this.height - 180),
            new Coin(this, 240, this.height - 180),
            new Coin(this, 450, this.height - 240),
            new Coin(this, 150, this.height - 320),
            new Coin(this, 190, this.height - 320),
            new Coin(this, 600, this.height - 200),
            new Coin(this, 380, this.height - 360),
            new Coin(this, 420, this.height - 360),
        ]
        this.totalCoins = this.coins.length

        // Skapa fiender i nivån
        this.enemies = [
            new Enemy(this, 200, this.height - 220, 40, 40, 80),
            new Enemy(this, 450, this.height - 240, 40, 40),
            new Enemy(this, 360, this.height - 440, 40, 40, 50),
        ]

        // Skapa andra objekt i spelet (valfritt)
        this.gameObjects = []
    }
    
    restart() {
        this.init()
    }

    update(deltaTime) {
        // Kolla restart input
        if (this.inputHandler.keys.has('r') || this.inputHandler.keys.has('R')) {
            if (this.gameState === 'GAME_OVER' || this.gameState === 'WIN') {
                this.restart()
                return
            }
        }
        
        // Uppdatera bara om spelet är i PLAYING state
        if (this.gameState !== 'PLAYING') return
        
        // Uppdatera alla spelobjekt
        this.gameObjects.forEach(obj => obj.update(deltaTime))
        
        // Uppdatera plattformar (även om de är statiska)
        this.platforms.forEach(platform => platform.update(deltaTime))
        
        // Uppdatera mynt
        this.coins.forEach(coin => coin.update(deltaTime))
        
        // Uppdatera fiender
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
            enemy.isGrounded = false // till skillnad från spelaren så behöver vi sätta denna i loopen eftersom det är flera fiender
            
            this.platforms.forEach(platform => {
                enemy.handlePlatformCollision(platform)
            })
            
            // Vänd vid skärmkanter
            enemy.handleScreenBounds(this.width)
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
                coin.markedForDeletion = true
            }
        })
        
        // Kontrollera kollision med fiender
        this.enemies.forEach(enemy => {
            if (this.player.intersects(enemy) && !enemy.markedForDeletion) {
                // Spelaren tar skada
                this.player.takeDamage(enemy.damage)
            }
        })
        
        // Ta bort alla objekt markerade för borttagning
        this.coins = this.coins.filter(coin => !coin.markedForDeletion)
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion)

        // Förhindra att spelaren går utöver skärmen horisontellt
        if (this.player.x < 0) {
            this.player.x = 0
        }
        if (this.player.x + this.player.width > this.width) {
            this.player.x = this.width - this.player.width
        }
        
        // Kolla win condition - alla mynt samlade
        if (this.coinsCollected === this.totalCoins && this.gameState === 'PLAYING') {
            this.gameState = 'WIN'
        }
        
        // Kolla lose condition - spelaren är död
        if (this.player.health <= 0 && this.gameState === 'PLAYING') {
            this.gameState = 'GAME_OVER'
        }
    }

    draw(ctx) {
        // Rita alla plattformar
        this.platforms.forEach(platform => platform.draw(ctx))
        
        // Rita mynt
        this.coins.forEach(coin => coin.draw(ctx))
        
        // Rita fiender
        this.enemies.forEach(enemy => enemy.draw(ctx))
        
        // Rita andra spelobjekt
        this.gameObjects.forEach(obj => obj.draw(ctx))
        
        // Rita spelaren
        this.player.draw(ctx)
        
        // Rita UI sist (så det är överst)
        this.ui.draw(ctx)
        
        // Rita game state meddelanden
        if (this.gameState === 'GAME_OVER') {
            this.drawGameOver(ctx)
        } else if (this.gameState === 'WIN') {
            this.drawWin(ctx)
        }
    }
    
    drawGameOver(ctx) {
        // Halvgenomskinlig bakgrund
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, this.width, this.height)
        
        // Game Over text
        ctx.save()
        ctx.fillStyle = '#FF0000'
        ctx.font = 'bold 60px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50)
        
        // Score
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '30px Arial'
        ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 20)
        ctx.fillText(`Coins: ${this.coinsCollected}/${this.totalCoins}`, this.width / 2, this.height / 2 + 60)
        
        // Restart instruktion
        ctx.font = '24px Arial'
        ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 120)
        ctx.restore()
    }
    
    drawWin(ctx) {
        // Halvgenomskinlig bakgrund
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
        ctx.fillRect(0, 0, this.width, this.height)
        
        // Victory text
        ctx.save()
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 60px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('VICTORY!', this.width / 2, this.height / 2 - 50)
        
        // Score
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '30px Arial'
        ctx.fillText(`All Coins Collected!`, this.width / 2, this.height / 2 + 20)
        ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 60)
        
        // Restart instruktion
        ctx.font = '24px Arial'
        ctx.fillText('Press R to Play Again', this.width / 2, this.height / 2 + 120)
        ctx.restore()
    }
}