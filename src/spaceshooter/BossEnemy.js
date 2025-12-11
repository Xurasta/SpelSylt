import SpaceEnemy from './SpaceEnemy.js'
import BossProjectile from './BossProjectile.js'
import bossShip from '../assets/Shootem Up/SpaceShip_Boss-0001.png'

export default class BossEnemy extends SpaceEnemy {
    constructor(game, x, y, level = 0) {
        // Boss is much larger
        const width = 150
        const height = 240
        super(game, x, y, width, height, 0)
        
        // Override image with boss sprite
        this.image = new Image()
        this.image.src = bossShip
        this.imageLoaded = false
        
        this.image.onload = () => {
            this.imageLoaded = true
        }
        
        // Boss sprite sheet info (256x416, 3 rows x 2 columns)
        // Using row 2, column 0 (third row, first boss)
        this.spriteWidth = 256 / 2 // 128px per boss
        this.spriteHeight = 416 / 3 // ~138.67px per row
        this.spriteX = 0 // First column
        this.spriteY = (416 / 3) * 2 // Row 2 (third row, 0-indexed)
        
        // Boss level affects difficulty
        this.level = level
        
        // Boss stats - scale with level
        this.maxHealth = 20 + (level * 10) // +10 HP per level
        this.health = this.maxHealth
        this.damage = 2
        this.points = 500
        this.dropChance = 1.0 // Always drops powerup
        
        // Boss movement pattern - moves side to side at top
        this.velocityY = 0
        this.moveSpeed = 0.1 + (level * 0.02) // Faster at higher levels
        this.velocityX = this.moveSpeed
        this.targetY = 100 // Stay near top of screen
        this.isAtPosition = false
        
        // Shooting system - faster at higher levels
        this.canShoot = true
        this.shootCooldown = Math.max(800, 1500 - (level * 100)) // Faster shooting each level
        this.shootCooldownTimer = 0
        
        // Movement bounds
        this.leftBound = 50
        this.rightBound = game.width - width - 50
    }
    
    update(deltaTime) {
        // Move to target position first
        if (!this.isAtPosition) {
            this.y += 0.05 * deltaTime
            if (this.y >= this.targetY) {
                this.y = this.targetY
                this.isAtPosition = true
            }
        } else {
            // Side to side movement
            this.x += this.velocityX * deltaTime
            
            // Bounce at edges
            if (this.x <= this.leftBound || this.x >= this.rightBound) {
                this.velocityX = -this.velocityX
            }
        }
        
        // Shooting
        if (this.isAtPosition) {
            this.shootCooldownTimer += deltaTime
            
            if (this.shootCooldownTimer >= this.shootCooldown) {
                this.shoot()
                this.shootCooldownTimer = 0
            }
        }
        
        // Don't call super.update() - we don't want normal enemy behavior
    }
    
    shoot() {
        // Shoot 3 projectiles in a spread pattern
        const centerX = this.x + this.width / 2
        const startY = this.y + this.height
        
        // Center projectile
        this.game.projectiles.push(
            new BossProjectile(this.game, centerX - 8, startY, 0, 0.3)
        )
        
        // Left projectile
        this.game.projectiles.push(
            new BossProjectile(this.game, centerX - 20, startY, -0.15, 0.3)
        )
        
        // Right projectile
        this.game.projectiles.push(
            new BossProjectile(this.game, centerX + 4, startY, 0.15, 0.3)
        )
    }
    
    draw(ctx, camera) {
        if (!this.imageLoaded) {
            // Fallback
            ctx.fillStyle = 'purple'
            ctx.fillRect(this.x, this.y, this.width, this.height)
            return
        }
        
        // Draw boss sprite
        ctx.drawImage(
            this.image,
            this.spriteX, this.spriteY,
            this.spriteWidth, this.spriteHeight,
            this.x, this.y,
            this.width, this.height
        )
        
        // Draw health bar above boss
        const barWidth = this.width
        const barHeight = 8
        const healthPercent = this.health / this.maxHealth
        
        // Background
        ctx.fillStyle = '#333'
        ctx.fillRect(this.x, this.y - 15, barWidth, barHeight)
        
        // Health
        ctx.fillStyle = healthPercent > 0.5 ? '#FF9800' : '#F44336'
        ctx.fillRect(this.x, this.y - 15, barWidth * healthPercent, barHeight)
        
        // Border
        ctx.strokeStyle = '#FFF'
        ctx.lineWidth = 1
        ctx.strokeRect(this.x, this.y - 15, barWidth, barHeight)
        
        // Debug hitbox
        if (this.game.debug) {
            ctx.strokeStyle = 'purple'
            ctx.lineWidth = 1
            ctx.strokeRect(this.x, this.y, this.width, this.height)
        }
    }
}
