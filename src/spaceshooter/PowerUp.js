import GameObject from '../GameObject.js'
import bonusesSprite from '../assets/Shootem Up/Bonuses-0001.png'

export default class PowerUp extends GameObject {
    constructor(game, x, y, type = 'health') {
        const size = 30
        super(game, x, y, size, size)
        
        // Load bonuses sprite sheet
        this.image = new Image()
        this.image.src = bonusesSprite
        this.imageLoaded = false
        
        this.image.onload = () => {
            this.imageLoaded = true
        }
        
        // Sprite sheet info (160x160, 5 columns x 5 rows)
        // We only use row 0
        // Col 0: Health, Col 1: Shield, Col 2: Explosive, Col 3: Multi-shot, Col 4: 2x points
        this.spriteWidth = 160 / 5 // 32px per powerup
        this.spriteHeight = 160 / 5 // 32px per row
        
        // PowerUp types
        this.type = type
        const typeData = {
            health: { col: 0, effect: 'Restore 1 health' },
            shield: { col: 1, effect: 'Gain shield' }
        }
        
        const data = typeData[this.type]
        this.spriteX = data.col * this.spriteWidth
        this.spriteY = 0 // Row 0
        
        // Movement - powerups float down slowly
        this.velocityY = 0.1
        this.velocityX = 0
        
        // Lifespan - auto-delete after time
        this.lifetime = 8000 // 8 seconds
        this.age = 0
    }
    
    update(deltaTime) {
        this.age += deltaTime
        
        // Move down
        this.y += this.velocityY * deltaTime
        
        // Remove if too old or off screen
        if (this.age > this.lifetime || this.y > this.game.height + this.height) {
            this.markedForDeletion = true
        }
    }
    
    apply(player) {
        // Apply powerup effect to player
        if (this.type === 'health') {
            const wasAtFullHealth = player.health === player.maxHealth
            player.health = Math.min(player.health + 1, player.maxHealth)
            
            // If at full health, reduce gun heat as bonus
            if (wasAtFullHealth) {
                player.heat = Math.max(0, player.heat - 30)
            }
        } else if (this.type === 'shield') {
            player.shield = true
            player.shieldDuration = 5000 // 5 seconds
        }
        
        // Mark for deletion after being picked up
        this.markedForDeletion = true
    }
    
    draw(ctx, camera) {
        if (!this.imageLoaded) {
            // Fallback
            ctx.fillStyle = this.type === 'health' ? 'green' : 'cyan'
            ctx.fillRect(this.x, this.y, this.width, this.height)
            return
        }
        
        // Draw powerup sprite (no camera offset - fixed screen)
        ctx.drawImage(
            this.image,
            this.spriteX, this.spriteY,
            this.spriteWidth, this.spriteHeight,
            this.x, this.y,
            this.width, this.height
        )
        
        // Debug hitbox
        if (this.game.debug) {
            ctx.strokeStyle = 'yellow'
            ctx.lineWidth = 2
            ctx.strokeRect(this.x, this.y, this.width, this.height)
        }
    }
}
