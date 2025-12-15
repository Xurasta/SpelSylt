import GameObject from "../GameObject.js"

export default class TwinstickEnemy extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height)
        this.color = '#FF6B6B' // Röd färg för fiender
        
        // Rörelse
        this.moveSpeed = 0.1 // Långsammare än spelaren
        this.velocityX = 0
        this.velocityY = 0
        
        // Health
        this.maxHealth = 3
        this.health = this.maxHealth
        
        // Shooting
        this.shootCooldown = 0
        this.shootCooldownDuration = 2000 // Skjuter var 2:e sekund
        this.shootRange = 300 // Skjuter bara om spelaren är inom detta avstånd
        
        // AI state
        this.state = 'idle' // idle, chase, seek, shoot
        this.lastSeenPosition = { x: x, y: y } // Senaste kända position av spelaren
    }
    
    update(deltaTime) {
        const player = this.game.player
        
        // Beräkna avstånd till spelaren
        const dx = player.x - this.x
        const dy = player.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Uppdatera cooldowns
        this.updateCooldown('shootCooldown', deltaTime)
        
        // Kolla Line of Sight (använder GameObject.hasLineOfSight)
        const arenaData = this.game.arena.getData()
        const hasLOS = this.hasLineOfSight(player, arenaData.walls)
        
        // Om vi har line of sight, uppdatera last seen position
        if (hasLOS) {
            this.lastSeenPosition.x = player.x
            this.lastSeenPosition.y = player.y
        }
        
        // AI beteende baserat på avstånd och LOS
        if (hasLOS && distance < this.shootRange) {
            // Inom skjutavstånd OCH har line of sight - stanna och skjut
            this.state = 'shoot'
            this.velocityX = 0
            this.velocityY = 0
            
            // Skjut om cooldown är klar
            if (this.shootCooldown <= 0) {
                this.shoot()
                this.startCooldown('shootCooldown', this.shootCooldownDuration)
            }
        } else if (hasLOS) {
            // Har line of sight men för långt bort - jaga spelaren direkt
            this.state = 'chase'
            
            // Normalisera riktningen
            const directionX = dx / distance
            const directionY = dy / distance
            
            // Rör sig mot spelaren
            this.velocityX = directionX * this.moveSpeed
            this.velocityY = directionY * this.moveSpeed
        } else {
            // Ingen line of sight - gå mot senaste kända position
            this.state = 'seek'
            
            const seekDx = this.lastSeenPosition.x - this.x
            const seekDy = this.lastSeenPosition.y - this.y
            const seekDistance = Math.sqrt(seekDx * seekDx + seekDy * seekDy)
            
            // Om vi är nära senaste kända position, stanna och leta
            if (seekDistance < 50) {
                this.velocityX = 0
                this.velocityY = 0
            } else {
                // Rör sig mot senaste kända position
                const seekDirX = seekDx / seekDistance
                const seekDirY = seekDy / seekDistance
                this.velocityX = seekDirX * this.moveSpeed
                this.velocityY = seekDirY * this.moveSpeed
            }
        }
        
        // Uppdatera position
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
    }
    
    shoot() {
        const player = this.game.player
        
        // Beräkna riktning från fienden till spelaren
        const centerX = this.x + this.width / 2
        const centerY = this.y + this.height / 2
        const playerCenterX = player.x + player.width / 2
        const playerCenterY = player.y + player.height / 2
        
        const dx = playerCenterX - centerX
        const dy = playerCenterY - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Normalisera riktningen
        const directionX = dx / distance
        const directionY = dy / distance
        
        // Skapa fiendens projektil
        this.game.addEnemyProjectile(centerX, centerY, directionX, directionY)
    }
    
    takeDamage(amount) {
        this.health -= amount
        if (this.health <= 0) {
            this.markedForDeletion = true
            // Lägg till poäng när fiende dör
            this.game.score += 100
        }
    }
    
    draw(ctx, camera) {
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Rita fienden som en rektangel
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
        
        // Rita kant
        ctx.strokeStyle = '#8B0000' // Mörkröd
        ctx.lineWidth = 2
        ctx.strokeRect(screenX, screenY, this.width, this.height)
        
        // Rita health bar ovanför fienden
        this.drawHealthBar(ctx, screenX, screenY)
        
        // Rita debug-information om debug-läge är på
        if (this.game.inputHandler.debugMode) {
            this.drawDebug(ctx, camera)
            
            const player = this.game.player
            const arenaData = this.game.arena.getData()
            const hasLOS = this.hasLineOfSight(player, arenaData.walls)
            
            // Rita line of sight linje
            const centerX = this.x + this.width / 2
            const centerY = this.y + this.height / 2
            const playerCenterX = player.x + player.width / 2
            const playerCenterY = player.height / 2
            
            const screenX1 = camera ? centerX - camera.x : centerX
            const screenY1 = camera ? centerY - camera.y : centerY
            const screenX2 = camera ? playerCenterX - camera.x : playerCenterX
            const screenY2 = camera ? playerCenterY - camera.y : playerCenterY
            
            // Grön = har LOS, Röd = ingen LOS
            ctx.strokeStyle = hasLOS ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(screenX1, screenY1)
            ctx.lineTo(screenX2, screenY2)
            ctx.stroke()
            
            // Rita skjutavstånd
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)'
            ctx.beginPath()
            ctx.arc(screenX1, screenY1, this.shootRange, 0, Math.PI * 2)
            ctx.stroke()
            
            // Rita state text
            ctx.fillStyle = 'white'
            ctx.font = '12px Arial'
            ctx.fillText(this.state.toUpperCase(), screenX1, screenY1 - 20)
            
            // Rita senaste kända position om i SEEK-läge
            if (this.state === 'seek') {
                const lastSeenScreenX = camera ? this.lastSeenPosition.x - camera.x : this.lastSeenPosition.x
                const lastSeenScreenY = camera ? this.lastSeenPosition.y - camera.y : this.lastSeenPosition.y
                
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'
                ctx.beginPath()
                ctx.arc(lastSeenScreenX, lastSeenScreenY, 10, 0, Math.PI * 2)
                ctx.fill()
            }
        }
    }
    
    drawHealthBar(ctx, screenX, screenY) {
        const barWidth = this.width
        const barHeight = 4
        const healthPercent = this.health / this.maxHealth
        
        // Bakgrund
        ctx.fillStyle = '#333'
        ctx.fillRect(screenX, screenY - 8, barWidth, barHeight)
        
        // Health
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : '#F44336'
        ctx.fillRect(screenX, screenY - 8, barWidth * healthPercent, barHeight)
    }
}
