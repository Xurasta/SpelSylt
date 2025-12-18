import GameObject from './GameObject.js'
import Vector2 from './Vector2.js'

/**
 * Enemy - Fiende som följer en path
 * 
 * Enemy rör sig längs en förutbestämd path (array av Vector2 waypoints).
 * När enemy når slutet skadar den player base och försvinner.
 */
export default class Enemy extends GameObject {
    /**
     * @param {Object} game - Game instance
     * @param {Array<Vector2>} path - Array av waypoints att följa
     * @param {Object} [config={}] - Enemy configuration
     */
    constructor(game, path, config = {}) {
        // Starta på första waypoint
        const start = path[0]
        super(game, start.x, start.y, 32, 32)
        
        // Path följning
        this.path = path
        this.currentWaypoint = 1  // Börja gå mot waypoint 1 (står redan på 0)
        
        // Movement
        this.velocity = new Vector2(0, 0)
        this.speed = config.speed || 0.08  // pixels per millisekund
        
        // Health
        this.maxHealth = config.health || 100
        this.health = this.maxHealth
        
        // Rewards
        this.goldValue = config.gold || 25
        this.scoreValue = config.score || 10
        
        // Visual
        this.color = config.color || 'red'
        this.healthBarColor = 'lime'
        this.healthBarBg = 'darkred'
        
        // State
        this.reachedEnd = false
    }
    
    /**
     * Update enemy position och path following
     * @param {number} deltaTime - Tid sedan förra frame
     */
    update(deltaTime) {
        // Om redan dött eller nått slutet, gör inget
        if (this.markedForDeletion || this.reachedEnd) {
            return
        }
        
        // Hämta nästa waypoint
        if (this.currentWaypoint >= this.path.length) {
            // Nått slutet av path
            this.reachEnd()
            return
        }
        
        const target = this.path[this.currentWaypoint]
        
        // Beräkna direction till waypoint (Vector2!)
        const toTarget = target.subtract(this.position)
        const direction = toTarget.normalize()
        
        // Sätt velocity baserat på direction och speed
        this.velocity = direction.multiply(this.speed)
        
        // Flytta enemy
        this.position.addScaled(this.velocity, deltaTime)
        
        // Kolla om vi nått waypoint (distance check)
        const distanceToWaypoint = this.position.distanceTo(target)
        if (distanceToWaypoint < 5) {
            // Nått waypoint - gå vidare till nästa
            this.currentWaypoint++
        }
    }
    
    /**
     * Ta skada
     * @param {number} damage - Skada att ta
     * @returns {boolean} True om enemy dog
     */
    takeDamage(damage) {
        this.health -= damage
        
        if (this.health <= 0) {
            this.health = 0
            this.die()
            return true
        }
        
        return false
    }
    
    /**
     * Enemy når slutet av path
     */
    reachEnd() {
        this.reachedEnd = true
        
        // Skada player base
        this.game.lives -= 1
        
        // Emit event
        this.game.events.emit('enemyReachedEnd', {
            enemy: this,
            damage: 1
        })
        
        // Ta bort enemy
        this.markedForDeletion = true
        
        console.log('Enemy reached end! Lives:', this.game.lives)
    }
    
    /**
     * Enemy dör
     */
    die() {
        this.markedForDeletion = true
        
        // Event emittas från TowerDefenseGame när collision detekteras
        // (för att ge gold och score)
        
        console.log('Enemy died!')
    }
    
    /**
     * Rita enemy
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Camera} [camera=null] - Optional camera
     */
    draw(ctx, camera = null) {
        const offsetX = camera ? camera.position.x : 0
        const offsetY = camera ? camera.position.y : 0
        
        const screenX = this.position.x - offsetX
        const screenY = this.position.y - offsetY
        
        // Rita enemy body
        ctx.fillStyle = this.color
        ctx.fillRect(
            screenX - this.width / 2,  // Center på position
            screenY - this.height / 2,
            this.width,
            this.height
        )
        
        // Rita enemy outline
        ctx.strokeStyle = 'darkred'
        ctx.lineWidth = 2
        ctx.strokeRect(
            screenX - this.width / 2,
            screenY - this.height / 2,
            this.width,
            this.height
        )
        
        // Rita health bar
        const healthBarWidth = this.width
        const healthBarHeight = 4
        const healthPercent = this.health / this.maxHealth
        
        // Background (lost health)
        ctx.fillStyle = this.healthBarBg
        ctx.fillRect(
            screenX - healthBarWidth / 2,
            screenY - this.height / 2 - 8,
            healthBarWidth,
            healthBarHeight
        )
        
        // Current health
        ctx.fillStyle = this.healthBarColor
        ctx.fillRect(
            screenX - healthBarWidth / 2,
            screenY - this.height / 2 - 8,
            healthBarWidth * healthPercent,
            healthBarHeight
        )
        
        // Debug: Rita path (om debug mode)
        if (this.game.inputHandler.debugMode) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            
            for (let i = 0; i < this.path.length; i++) {
                const wp = this.path[i]
                const x = wp.x - offsetX
                const y = wp.y - offsetY
                
                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
                
                // Rita waypoint som cirkel
                ctx.fillStyle = i === this.currentWaypoint ? 'yellow' : 'rgba(255, 255, 0, 0.3)'
                ctx.beginPath()
                ctx.arc(x, y, 5, 0, Math.PI * 2)
                ctx.fill()
                ctx.beginPath()
                ctx.moveTo(x, y)
            }
            
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
            ctx.stroke()
            
            // Rita velocity vector
            ctx.strokeStyle = 'cyan'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(screenX, screenY)
            ctx.lineTo(
                screenX + this.velocity.x * 100,
                screenY + this.velocity.y * 100
            )
            ctx.stroke()
        }
    }
}
