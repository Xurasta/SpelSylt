import GameObject from "../GameObject.js"

export default class TwinstickPlayer extends GameObject {
    constructor(game, x, y, width, height, color) {
        super(game, x, y, width, height)
        this.color = color

        // Nuvarande hastighet (pixels per millisekund)
        this.velocityX = 0
        this.velocityY = 0

        // Rörelsehastighet (hur snabbt spelaren accelererar/rör sig)
        this.moveSpeed = 0.2
        this.directionX = 0
        this.directionY = 0

        // Health system
        this.maxHealth = 5
        this.health = this.maxHealth
        this.invulnerable = false // Immun mot skada efter att har blivit träffad
        this.invulnerableTimer = 0
        this.invulnerableDuration = 1000 // 1 sekund i millisekunder
        
        // Shooting system
        this.shootCooldown = 0
        this.shootCooldownDuration = 200 // Millisekunder mellan skott
        
        // Ammo system
        this.maxAmmo = 12 // Skott per magasin
        this.currentAmmo = this.maxAmmo
        this.reserveAmmo = 60 // Total reserv-ammo
        this.isReloading = false
        this.reloadTimer = 0
        this.reloadDuration = 1500 // Millisekunder att ladda om
        
        // Dash system
        this.isDashing = false
        this.dashSpeed = 0.8 // Mycket snabbare än normal rörelse
        this.dashDuration = 150 // Millisekunder som dashen varar
        this.dashTimer = 0
        this.dashCooldown = 0
        this.dashCooldownDuration = 500 // Millisekunder mellan dashes
        this.dashDirectionX = 0
        this.dashDirectionY = 0
        this.lastMoveDirectionX = 0 // Spara senaste rörelseriktningen
        this.lastMoveDirectionY = 0
        
        // Sprite animations - no assets loaded yet, will fallback to rectangle
        // TODO: Load sprite animations here when assets are ready
        // this.loadSprite('idle', idleSprite, frameCount, frameInterval)
        // this.loadSprite('walk', walkSprite, frameCount, frameInterval)
        this.currentAnimation = 'idle'

    }

    update(deltaTime) {
        // Hantera dash
        if (this.isDashing) {
            this.dashTimer -= deltaTime
            if (this.dashTimer <= 0) {
                this.isDashing = false
            }
            // Under dash, rör sig i dashens riktning
            this.x += this.dashDirectionX * this.dashSpeed * deltaTime
            this.y += this.dashDirectionY * this.dashSpeed * deltaTime
        } else {
            // Normal rörelse (endast när inte dashar)
            if (this.game.inputHandler.keys.has('a')) {
                this.velocityX = -this.moveSpeed
                this.directionX = -1
            } else if (this.game.inputHandler.keys.has('d')) {
                this.velocityX = this.moveSpeed
                this.directionX = 1
            } else {
                this.velocityX = 0
                this.directionX = 0
            }

            if (this.game.inputHandler.keys.has('w')) {
                this.velocityY = -this.moveSpeed
                this.directionY = -1
            } else if (this.game.inputHandler.keys.has('s')) {
                this.velocityY = this.moveSpeed
                this.directionY = 1
            } else {
                this.velocityY = 0
                this.directionY = 0
            }
            
            // Spara senaste rörelseriktningen (för dash när man står still)
            if (this.directionX !== 0 || this.directionY !== 0) {
                this.lastMoveDirectionX = this.directionX
                this.lastMoveDirectionY = this.directionY
            }

            // Uppdatera position baserat på hastighet och deltaTime
            this.x += this.velocityX * deltaTime
            this.y += this.velocityY * deltaTime
        }

        // Håll spelaren inom världens gränser
        this.x = Math.max(0, Math.min(this.x, this.game.worldWidth - this.width))
        this.y = Math.max(0, Math.min(this.y, this.game.worldHeight - this.height))
        
        // Uppdatera animation state baserat på movement
        if (this.velocityX !== 0 || this.velocityY !== 0) {
            this.setAnimation('walk')
        } else {
            this.setAnimation('idle')
        }
        
        // Uppdatera animation frame
        this.updateAnimation(deltaTime)
        
        // Hantera cooldowns (använder GameObject.updateCooldown())
        this.updateCooldown('shootCooldown', deltaTime)
        this.updateCooldown('dashCooldown', deltaTime)
        
        // Hantera reload
        if (this.isReloading) {
            this.reloadTimer -= deltaTime
            if (this.reloadTimer <= 0) {
                this.finishReload()
            }
        }
        
        // Aktivera dash med space-tangent
        if (this.game.inputHandler.keys.has(' ') && !this.isDashing && this.dashCooldown <= 0) {
            this.startDash()
        }
        
        // Starta reload med 'r'-tangent
        if (this.game.inputHandler.keys.has('r') && !this.isReloading && this.currentAmmo < this.maxAmmo && this.reserveAmmo > 0) {
            this.startReload()
        }
        
        // Auto-reload när magasinet är tomt
        if (this.currentAmmo === 0 && !this.isReloading && this.reserveAmmo > 0) {
            this.startReload()
        }
        
        // Skjut när vänster musknapp är nedtryckt (inte under dash eller reload)
        if (!this.isDashing && !this.isReloading && this.game.inputHandler.mouseButtons.has(0) && this.shootCooldown <= 0 && this.currentAmmo > 0) {
            this.shoot()
            this.startCooldown('shootCooldown', this.shootCooldownDuration)
        }
    }
    
    startDash() {
        // Använd nuvarande rörelseriktning, eller senaste om spelaren står still
        let dashDirX = this.directionX || this.lastMoveDirectionX
        let dashDirY = this.directionY || this.lastMoveDirectionY
        
        // Om ingen riktning finns, dash framåt (default)
        if (dashDirX === 0 && dashDirY === 0) {
            dashDirX = 0
            dashDirY = 1
        }
        
        // Normalisera riktningen för diagonal dash (annars blir det snabbare diagonalt)
        const magnitude = Math.sqrt(dashDirX * dashDirX + dashDirY * dashDirY)
        this.dashDirectionX = dashDirX / magnitude
        this.dashDirectionY = dashDirY / magnitude
        
        // Aktivera dash
        this.isDashing = true
        this.dashTimer = this.dashDuration
        this.startCooldown('dashCooldown', this.dashCooldownDuration)
        
        // Invulnerabilitet under dash
        this.invulnerable = true
        this.invulnerableTimer = this.dashDuration
    }
    
    startReload() {
        this.isReloading = true
        this.reloadTimer = this.reloadDuration
        console.log('Reloading...')
    }
    
    finishReload() {
        // Beräkna hur många skott som behövs för att fylla magasinet
        const ammoNeeded = this.maxAmmo - this.currentAmmo
        const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo)
        
        // Fyll på magasinet från reserven
        this.currentAmmo += ammoToReload
        this.reserveAmmo -= ammoToReload
        
        this.isReloading = false
        console.log(`Reload complete! Ammo: ${this.currentAmmo}/${this.maxAmmo} (Reserve: ${this.reserveAmmo})`)
    }
    
    shoot() {
        // Beräkna riktning från spelarens center till muspekarens position
        const centerX = this.x + this.width / 2
        const centerY = this.y + this.height / 2
        
        // Använd camera.screenToWorld() för att konvertera koordinater
        const mouseWorld = this.game.camera.screenToWorld(
            this.game.inputHandler.mouseX,
            this.game.inputHandler.mouseY
        )
        
        const dx = mouseWorld.x - centerX
        const dy = mouseWorld.y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Normalisera riktningen
        const directionX = dx / distance
        const directionY = dy / distance
        
        // Skapa projektil från spelarens position
        this.game.addProjectile(centerX, centerY, directionX, directionY)
        
        // Minska ammo
        this.currentAmmo--
    }

    draw(ctx, camera) {
        // Blinka när spelaren dashar (varannan 100ms)
        if (this.isDashing) {
            const blinkInterval = 100 // Millisekunder mellan blink
            const shouldShow = Math.floor(this.dashTimer / blinkInterval) % 2 === 0
            if (!shouldShow) {
                // Rita inte spelaren denna frame
                return
            }
        }
        
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        const spriteDrawn = this.drawSprite(ctx, camera, this.lastDirectionX === -1)
        if (!spriteDrawn) {
            // Fallback: Rita spelaren som en rektangel
            ctx.fillStyle = this.color
            ctx.fillRect(screenX, screenY, this.width, this.height)
        }
        
        // Rita debug-information om debug-läge är på
        if (this.game.inputHandler.debugMode) {
            this.drawDebug(ctx, camera)
            this.drawMouseLine(ctx, camera)
        }
    }

    // Rita linje från spelaren till muspekaren (debug)
    drawMouseLine(ctx, camera) {
        const centerX = this.x + this.width / 2
        const centerY = this.y + this.height / 2
        const screenCenterX = camera ? centerX - camera.x : centerX
        const screenCenterY = camera ? centerY - camera.y : centerY
        
        ctx.strokeStyle = 'cyan'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(screenCenterX, screenCenterY)
        ctx.lineTo(this.game.inputHandler.mouseX, this.game.inputHandler.mouseY)
        ctx.stroke()
    }
}