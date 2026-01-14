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
        
        // Stun system
        this.stunDuration = 300 // milliseconds
        this.stunTimer = 0
        
        // Knockback system
        this.knockbackVelocityX = 0
        this.knockbackVelocityY = 0
        
        // Damage flash
        this.damageFlashTimer = 0
        this.damageFlashDuration = 100 // milliseconds
        
        // Damage
        this.damage = 1
        this.attackCooldown = 0
        this.attackCooldownDuration = 1000 // 1 second between attacks
    }
    
    get isStunned() {
        return this.stunTimer > 0
    }
    
    update(deltaTime) {
        // Update timers
        this.updateTimer('attackCooldown', deltaTime)
        this.updateTimer('stunTimer', deltaTime)
        this.updateTimer('damageFlashTimer', deltaTime)
        
        // Apply knockback velocity if exists
        if (this.knockbackVelocityX !== 0 || this.knockbackVelocityY !== 0) {
            this.x += this.knockbackVelocityX * deltaTime
            this.y += this.knockbackVelocityY * deltaTime
            
            // Decay knockback over time
            const decay = 0.95
            this.knockbackVelocityX *= decay
            this.knockbackVelocityY *= decay
            
            // Stop knockback when very small
            if (Math.abs(this.knockbackVelocityX) < 0.01) this.knockbackVelocityX = 0
            if (Math.abs(this.knockbackVelocityY) < 0.01) this.knockbackVelocityY = 0
        }
        
        // Only seek player if not stunned
        if (!this.isStunned && this.game.player) {
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
        
        // Keep enemy within world bounds
        this.x = Math.max(0, Math.min(this.x, this.game.worldWidth - this.width))
        this.y = Math.max(0, Math.min(this.y, this.game.worldHeight - this.height))
    }
    
    draw(ctx, camera = null) {
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Flash white when damaged
        if (this.damageFlashTimer > 0) {
            ctx.fillStyle = '#FFFFFF'
        } else {
            ctx.fillStyle = this.color
        }
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
        this.damageFlashTimer = this.damageFlashDuration
        
        if (this.health <= 0) {
            this.health = 0
            this.markedForDeletion = true
            return true // Enemy died
        }
        
        return false
    }
    
    /**
     * Take hit from melee attack with knockback
     * @param {number} damage - Damage amount
     * @param {number} knockbackDirX - Knockback direction X (-1, 0, 1)
     * @param {number} knockbackDirY - Knockback direction Y (-1, 0, 1)
     * @param {number} knockbackDistance - Distance to push back
     */
    takeHit(damage, knockbackDirX, knockbackDirY, knockbackDistance) {
        // Apply damage
        const died = this.takeDamage(damage)
        
        if (!died) {
            // Apply stun
            this.stunTimer = this.stunDuration
            
            // Calculate knockback velocity
            // Spread knockback over stun duration
            const knockbackSpeed = knockbackDistance / this.stunDuration
            this.knockbackVelocityX = knockbackDirX * knockbackSpeed
            this.knockbackVelocityY = knockbackDirY * knockbackSpeed
        }
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
