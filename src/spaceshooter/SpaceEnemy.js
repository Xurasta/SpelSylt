import GameObject from '../GameObject.js'
import enemyShips from '../assets/Shootem Up/SpaceShips_Enemy-0001.png'

export default class SpaceEnemy extends GameObject {
    constructor(game, x, y, width, height, enemyType = 0) {
        super(game, x, y, width, height)
        
        // Load enemy sprite sheet
        this.image = new Image()
        this.image.src = enemyShips
        this.imageLoaded = false
        
        this.image.onload = () => {
            this.imageLoaded = true
        }
        
        // Sprite sheet info (256x256, 3 rows for colors)
        // Manual positioning for each enemy size from left to right
        const spriteSheetHeight = 256
        
        // Define each enemy: startX, width, stats, and powerup drop chance
        const enemyData = [
            { startX: 30, width: 55, health: 3, damage: 2, speed: 0.1, points: 100, dropChance: 0.4 }, // Large - 40% drop
            { startX: 90, width: 50, health: 2, damage: 1, speed: 0.13, points: 50, dropChance: 0.25 },  // Medium - 25% drop
            { startX: 145, width: 45, health: 2, damage: 1, speed: 0.15, points: 30, dropChance: 0.1 }, // Small - 10% drop
            { startX: 195, width: 28, health: 1, damage: 1, speed: 0.2, points: 10, dropChance: 0.05 }   // Tiny - 5% drop
        ]
        
        this.spriteHeight = spriteSheetHeight / 3 // 85.33px per row
        
        // enemyType: 0-11
        // Size: enemyType % 4 (0=large, 1=medium, 2=small, 3=tiny)
        // Color row: Math.floor(enemyType / 4) (0-2)
        this.enemyType = enemyType % 12
        const sizeIndex = this.enemyType % 4
        const row = Math.floor(this.enemyType / 4)
        
        const data = enemyData[sizeIndex]
        
        // Sprite position and size
        this.spriteX = data.startX
        this.spriteY = row * this.spriteHeight
        this.spriteWidth = data.width
        
        // Update actual width/height based on enemy size
        this.width = data.width
        this.height = data.width // Keep aspect ratio square-ish
        
        // Movement - fiender rör sig nedåt (mot spelaren)
        this.velocityX = 0
        this.velocityY = data.speed // Snabbare för mindre fiender
        
        // Optional side-to-side movement
        this.sideSpeed = (Math.random() - 0.5) * 0.1 // Random horizontal drift
        this.velocityX = this.sideSpeed
        
        // Stats från size
        this.health = data.health
        this.damage = data.damage
        this.points = data.points // Poäng när besegrat
        this.dropChance = data.dropChance // Powerup drop chance
        this.sizeIndex = sizeIndex // Store for drop chance calculation
    }
    
    update(deltaTime) {
        // Flytta fienden
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // Ta bort fiender som lämnat skärmen (nedåt)
        if (this.y > this.game.height + this.height) {
            this.markedForDeletion = true
        }
        
        // Håll fiender inom skärmens bredd
        if (this.x < 0 || this.x > this.game.width - this.width) {
            this.velocityX = -this.velocityX // Bounce back
        }
    }
    
    takeDamage(amount) {
        this.health -= amount
        if (this.health <= 0) {
            this.markedForDeletion = true
        }
    }
    
    draw(ctx, camera) {
        if (!this.imageLoaded) {
            // Fallback rectangle
            ctx.fillStyle = 'red'
            ctx.fillRect(this.x, this.y, this.width, this.height)
            return
        }
        
        // Rita enemy från sprite sheet (ingen camera offset - fixed screen)
        ctx.drawImage(
            this.image,
            this.spriteX, this.spriteY, // Source position
            this.spriteWidth, this.spriteHeight, // Source size
            this.x, this.y, // Destination position
            this.width, this.height // Destination size
        )
        
        // Debug hitbox
        if (this.game.debug) {
            ctx.strokeStyle = 'red'
            ctx.lineWidth = 1
            ctx.strokeRect(this.x, this.y, this.width, this.height)
        }
    }
}
