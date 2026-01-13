import GameObject from '../GameObject.js'

/**
 * Player for top-down game
 * WASD movement, arrow key shooting, no gravity/jumping
 */
export default class TopDownPlayer extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height)
        this.color = 'purple'
        
        // Movement (pixels per millisecond)
        this.velocityX = 0
        this.velocityY = 0
        this.moveSpeed = 0.2
        this.directionX = 0
        this.directionY = 0
        
        // Health system
        this.maxHealth = 3
        this.health = this.maxHealth
        this.invulnerableTimer = 0
        this.invulnerableDuration = 1000 // 1 second invulnerability after damage
        
        // Shooting system
        this.shootCooldown = 0
        this.shootCooldownDuration = 300 // milliseconds between shots
        this.lastShootDirectionX = 1 // Remember last shoot direction
        this.lastShootDirectionY = 0
    }
    
    get isInvulnerable() {
        return this.invulnerableTimer > 0
    }
    
    update(deltaTime) {
        // Handle movement with WASD
        this.velocityX = 0
        this.velocityY = 0
        
        if (this.game.inputHandler.keys.has('w')) {
            this.velocityY = -this.moveSpeed
            this.directionY = -1
        } else if (this.game.inputHandler.keys.has('s')) {
            this.velocityY = this.moveSpeed
            this.directionY = 1
        } else {
            this.directionY = 0
        }
        
        if (this.game.inputHandler.keys.has('a')) {
            this.velocityX = -this.moveSpeed
            this.directionX = -1
        } else if (this.game.inputHandler.keys.has('d')) {
            this.velocityX = this.moveSpeed
            this.directionX = 1
        } else {
            this.directionX = 0
        }
        
        // Update position
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // Keep player within world bounds
        this.x = Math.max(0, Math.min(this.x, this.game.worldWidth - this.width))
        this.y = Math.max(0, Math.min(this.y, this.game.worldHeight - this.height))
        
        // Handle shooting with arrow keys
        let shootDirX = 0
        let shootDirY = 0
        
        if (this.game.inputHandler.keys.has('ArrowUp')) {
            shootDirY = -1
        } else if (this.game.inputHandler.keys.has('ArrowDown')) {
            shootDirY = 1
        }
        
        if (this.game.inputHandler.keys.has('ArrowLeft')) {
            shootDirX = -1
        } else if (this.game.inputHandler.keys.has('ArrowRight')) {
            shootDirX = 1
        }
        
        // Shoot if arrow key pressed and cooldown ready
        if ((shootDirX !== 0 || shootDirY !== 0) && this.shootCooldown <= 0) {
            // Normalize direction
            const length = Math.sqrt(shootDirX * shootDirX + shootDirY * shootDirY)
            if (length > 0) {
                shootDirX /= length
                shootDirY /= length
            }
            
            // Store last shoot direction
            this.lastShootDirectionX = shootDirX
            this.lastShootDirectionY = shootDirY
            
            // Create projectile from center of player
            this.game.addProjectile(
                this.x + this.width / 2,
                this.y + this.height / 2,
                shootDirX,
                shootDirY
            )
            
            this.shootCooldown = this.shootCooldownDuration
        }
        
        // Update timers
        this.updateTimer('shootCooldown', deltaTime)
        this.updateTimer('invulnerableTimer', deltaTime)
    }
    
    draw(ctx, camera = null) {
        // Blink when invulnerable
        if (this.isInvulnerable) {
            const blinkSpeed = 100
            if (Math.floor(this.invulnerableTimer / blinkSpeed) % 2 === 0) {
                return
            }
        }
        
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Draw player as colored box
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
        
        // Draw simple eyes to show direction
        const eyeSize = 4
        const eyeOffsetX = this.width / 3
        const eyeOffsetY = this.height / 3
        
        ctx.fillStyle = 'white'
        ctx.fillRect(screenX + eyeOffsetX - eyeSize/2, screenY + eyeOffsetY, eyeSize, eyeSize)
        ctx.fillRect(screenX + this.width - eyeOffsetX - eyeSize/2, screenY + eyeOffsetY, eyeSize, eyeSize)
    }
    
    takeDamage(amount) {
        if (this.isInvulnerable) return false
        
        this.health -= amount
        this.invulnerableTimer = this.invulnerableDuration
        
        if (this.health <= 0) {
            this.health = 0
            this.markedForDeletion = true
            return true // Player died
        }
        
        return false
    }
}
