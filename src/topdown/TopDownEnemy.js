import GameObject from '../GameObject.js'

/**
 * Simple enemy for top-down game
 * Seeks player and damages on collision
 */
export default class TopDownEnemy extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height)
        this.color = 'red'
        
        // Movement
        this.moveSpeed = 0.1 // Slower than player
        this.velocityX = 0
        this.velocityY = 0
        
        // Health
        this.maxHealth = 2
        this.health = this.maxHealth
        
        // Damage
        this.damage = 1
        this.attackCooldown = 0
        this.attackCooldownDuration = 1000 // 1 second between attacks
    }
    
    update(deltaTime) {
        // Simple seek behavior - move toward player
        if (this.game.player) {
            const player = this.game.player
            
            // Calculate direction to player
            const dx = player.x - this.x
            const dy = player.y - this.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            // Normalize and apply speed
            if (distance > 0) {
                this.velocityX = (dx / distance) * this.moveSpeed
                this.velocityY = (dy / distance) * this.moveSpeed
                
                // Update position
                this.x += this.velocityX * deltaTime
                this.y += this.velocityY * deltaTime
            }
        }
        
        // Update cooldown
        this.updateTimer('attackCooldown', deltaTime)
        
        // Keep enemy within world bounds
        this.x = Math.max(0, Math.min(this.x, this.game.worldWidth - this.width))
        this.y = Math.max(0, Math.min(this.y, this.game.worldHeight - this.height))
    }
    
    draw(ctx, camera = null) {
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Draw enemy as red box
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
        
        // Draw simple angry eyes
        const eyeSize = 4
        const eyeOffsetX = this.width / 3
        const eyeOffsetY = this.height / 3
        
        ctx.fillStyle = 'yellow'
        ctx.fillRect(screenX + eyeOffsetX - eyeSize/2, screenY + eyeOffsetY, eyeSize, eyeSize)
        ctx.fillRect(screenX + this.width - eyeOffsetX - eyeSize/2, screenY + eyeOffsetY, eyeSize, eyeSize)
        
        // Draw health bar
        const barWidth = this.width
        const barHeight = 4
        const barY = screenY - 8
        
        // Background
        ctx.fillStyle = '#333'
        ctx.fillRect(screenX, barY, barWidth, barHeight)
        
        // Health
        const healthPercent = this.health / this.maxHealth
        ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00'
        ctx.fillRect(screenX, barY, barWidth * healthPercent, barHeight)
    }
    
    takeDamage(amount) {
        this.health -= amount
        
        if (this.health <= 0) {
            this.health = 0
            this.markedForDeletion = true
            return true // Enemy died
        }
        
        return false
    }
    
    /**
     * Attack player on collision
     */
    attackPlayer(player) {
        if (this.attackCooldown <= 0) {
            player.takeDamage(this.damage)
            this.attackCooldown = this.attackCooldownDuration
        }
    }
}
