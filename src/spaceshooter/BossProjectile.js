import GameObject from '../GameObject.js'

export default class BossProjectile extends GameObject {
    constructor(game, x, y, velocityX, velocityY) {
        super(game, x, y, 12, 12)
        
        // Movement
        this.velocityX = velocityX
        this.velocityY = velocityY
        
        // Damage to player
        this.damage = 1
    }
    
    update(deltaTime) {
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // Remove if off screen
        if (this.y > this.game.height + this.height || 
            this.x < -this.width || 
            this.x > this.game.width) {
            this.markedForDeletion = true
        }
    }
    
    draw(ctx, camera) {
        // Draw orange fireball
        ctx.fillStyle = '#FF6600'
        ctx.beginPath()
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2)
        ctx.fill()
        
        // Add glow effect
        ctx.fillStyle = '#FF9933'
        ctx.beginPath()
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 3, 0, Math.PI * 2)
        ctx.fill()
        
        // Debug hitbox
        if (this.game.debug) {
            ctx.strokeStyle = 'orange'
            ctx.lineWidth = 2
            ctx.strokeRect(this.x, this.y, this.width, this.height)
        }
    }
}
