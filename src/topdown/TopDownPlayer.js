import GameObject from '../GameObject.js'
import attack1Sprite from "../assets/character template/V1.1/sprite_sheet/attack1_sprite_sheet_template.png"
import walkSprite from "../assets/character template/V1.1/sprite_sheet/walk_sprite_sheet_template.png"
import idleSprite from "../assets/character template/V1.1/sprite_sheet/Idle_sprite_sheet_template.png"

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

        // Track last move direction for attacks
        this.lastMoveDirectionX = 0
        this.lastMoveDirectionY = 1 // Default facing down

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

        // Melee attack system
        this.meleeRange = 60 // Attack range in pixels
        this.meleeDamage = 1
        this.meleeAttackCooldown = 0
        this.meleeAttackCooldownDuration = 400 // milliseconds between attacks
        this.isAttacking = false
        this.attackTimer = 0
        this.attackDisplayDuration = 150 // How long to show attack visual
        this.knockbackDistance = 30 // How far to push enemies back

        // Sprite animation system - ladda sprites med olika hastigheter
        const idleOptions = {
            framesX: 2,
            framesY: 1,
            frameInterval: 400,
            frameWidth: 48,
            frameHeight: 48,
            sourceX: 0,
            sourceY: 0,
            scale: 2
        }

        this.loadSprite("idleDown", idleSprite, idleOptions)
        idleOptions.sourceX = 96
        this.loadSprite("idleUp", idleSprite, idleOptions)
        idleOptions.sourceX = 192
        this.loadSprite("idleRight", idleSprite, idleOptions)
        idleOptions.sourceX = 288
        this.loadSprite("idleLeft", idleSprite, idleOptions)

        const walkOptions = {
            framesX: 4,
            framesY: 1,
            frameInterval: 100,
            frameWidth: 48,
            frameHeight: 48,
            sourceX: 0,
            sourceY: 0,
            scale: 2
        }
        this.loadSprite("walkUp", walkSprite, walkOptions)
        walkOptions.sourceX = 192
        this.loadSprite("walkDown", walkSprite, walkOptions)
        walkOptions.sourceX = 384
        this.loadSprite("walkRight", walkSprite, walkOptions)
        walkOptions.sourceX = 576
        this.loadSprite("walkLeft", walkSprite, walkOptions)

        const attack1Options = {
            framesX: 3,
            framesY: 1,
            frameInterval: 100,
            frameWidth: 48,
            frameHeight: 48,
            sourceX: 0,
            sourceY: 0,
            scale: 2
        }
        this.loadSprite("attack1Down", attack1Sprite, attack1Options)
        attack1Options.sourceX = 144
        this.loadSprite("attack1Up", attack1Sprite, attack1Options)
        attack1Options.sourceX = 288
        this.loadSprite("attack1Right", attack1Sprite, attack1Options)
        attack1Options.sourceX = 432
        this.loadSprite("attack1Left", attack1Sprite, attack1Options)

        this.currentAnimation = "idleDown"

    }

    get isInvulnerable() {
        return this.invulnerableTimer > 0
    }

    update(deltaTime) {
        // Handle movement with WASD
        this.velocityX = 0
        this.velocityY = 0

        let isMoving = false

        if (this.game.inputHandler.keys.has('w')) {
            this.setAnimation('walkUp')
            this.velocityY = -this.moveSpeed
            this.directionY = -1
            isMoving = true
        } else if (this.game.inputHandler.keys.has('s')) {
            this.setAnimation('walkDown')
            this.velocityY = this.moveSpeed
            this.directionY = 1
            isMoving = true
        } else {
            this.directionY = 0
        }

        if (this.game.inputHandler.keys.has('a')) {
            this.velocityX = -this.moveSpeed
            this.directionX = -1
            this.setAnimation('walkLeft')
            isMoving = true
        } else if (this.game.inputHandler.keys.has('d')) {
            this.velocityX = this.moveSpeed
            this.directionX = 1
            this.setAnimation('walkRight')
            isMoving = true
        } else {
            this.directionX = 0
        }
        
        // Set idle animation when not moving
        if (!isMoving) {
            // Use last direction to determine idle animation
            if (this.lastMoveDirectionY < 0) {
                this.setAnimation('idleUp')
            } else if (this.lastMoveDirectionY > 0) {
                this.setAnimation('idleDown')
            } else if (this.lastMoveDirectionX < 0) {
                this.setAnimation('idleLeft')
            } else if (this.lastMoveDirectionX > 0) {
                this.setAnimation('idleRight')
            } else {
                this.setAnimation('idleDown') // Default
            }
        }

        // Track last move direction for attacks
        if (this.directionX !== 0 || this.directionY !== 0) {
            this.lastMoveDirectionX = this.directionX
            this.lastMoveDirectionY = this.directionY
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

        // Handle melee attack with spacebar
        if (this.game.inputHandler.keys.has(' ') && this.meleeAttackCooldown <= 0) {
            this.performMeleeAttack()
            this.meleeAttackCooldown = this.meleeAttackCooldownDuration
            this.isAttacking = true
            this.attackTimer = this.attackDisplayDuration
        }

        // Update timers
        this.updateTimer('shootCooldown', deltaTime)
        this.updateTimer('invulnerableTimer', deltaTime)
        this.updateTimer('meleeAttackCooldown', deltaTime)
        this.updateTimer('attackTimer', deltaTime)

        // Reset attacking state when timer expires
        if (this.attackTimer <= 0) {
            this.isAttacking = false
        }

        this.updateAnimation(deltaTime)
    }

    /**
     * Perform melee attack in facing direction
     */
    performMeleeAttack() {
        const attackHitbox = this.getAttackHitbox()

        // Check collision with all enemies
        this.game.enemies.forEach(enemy => {
            if (attackHitbox.intersects(enemy)) {
                // Calculate knockback direction (normalized)
                const knockbackDirX = this.lastMoveDirectionX
                const knockbackDirY = this.lastMoveDirectionY

                // Apply damage with knockback
                enemy.takeHit(this.meleeDamage, knockbackDirX, knockbackDirY, this.knockbackDistance)
            }
        })
    }

    getAttackHitbox() {

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

        // Draw attack visual if attacking
        if (this.isAttacking && this.attackTimer > 0) {
            const attackHitbox = this.getAttackHitbox()
            const attackScreenX = camera ? attackHitbox.x - camera.x : attackHitbox.x
            const attackScreenY = camera ? attackHitbox.y - camera.y : attackHitbox.y

            // Draw attack hitbox as orange rectangle
            ctx.fillStyle = 'rgba(255, 165, 0, 0.6)' // Orange with transparency
            ctx.fillRect(attackScreenX, attackScreenY, attackHitbox.width, attackHitbox.height)

            // Draw attack border
            ctx.strokeStyle = '#FFA500'
            ctx.lineWidth = 2
            ctx.strokeRect(attackScreenX, attackScreenY, attackHitbox.width, attackHitbox.height)
        }

        const spriteDrawn = this.drawSprite(ctx, camera, this.lastDirectionX === -1)
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
