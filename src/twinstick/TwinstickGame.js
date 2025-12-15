import GameBase from "../GameBase.js"
import TwinstickPlayer from "./TwinstickPlayer.js"
import Projectile from "../Projectile.js"
import TwinstickArena from "./TwinstickArena.js"

export default class TwinstickGame extends GameBase {
    constructor(canvas) {
        super(canvas)

        // Justera world size för top-down spel
        this.worldWidth = canvas.width * 1.5
        this.worldHeight = canvas.height * 1.5
        this.camera.setWorldBounds(this.worldWidth, this.worldHeight)

        // Specifika egenskaper för TwinstickGame
        this.player = null
        this.npcs = []
        this.items = []
        this.projectiles = []
        this.arena = null

        this.init()
    }

    init() {
        // Skapa arena
        this.arena = new TwinstickArena(this)
        const arenaData = this.arena.getData()
        
        // Initiera spelobjekt som spelare, NPCs, items etc
        this.player = new TwinstickPlayer(
            this,
            arenaData.playerSpawnX,
            arenaData.playerSpawnY,
            32,
            32,
            'purple'
        )
        
        // Återställ camera
        this.camera.x = 0
        this.camera.y = 0
        this.camera.targetX = 0
        this.camera.targetY = 0
    }

    restart() {
        // Återställ spelet till initial state
    }
    
    addProjectile(x, y, directionX, directionY) {
        // Skapa en ny projektil med Projectile-klassen
        const projectile = new Projectile(this, x, y, directionX, directionY)
        projectile.speed = 0.6 // Twinstick är snabbare än platformer
        projectile.color = 'yellow'
        projectile.width = 8
        projectile.height = 8
        this.projectiles.push(projectile)
    }

    update(deltaTime) {
        // Uppdatera spel-logik varje frame
        const playerPrevX = this.player.x
        const playerPrevY = this.player.y
        
        this.player.update(deltaTime)
        
        // Kolla kollision mellan spelare och väggar
        const arenaData = this.arena.getData()
        arenaData.walls.forEach(wall => {
            const collision = this.player.getCollisionData(wall)
            if (collision) {
                // Återställ position baserat på kollisionsriktning
                if (collision.direction === 'left' || collision.direction === 'right') {
                    this.player.x = playerPrevX
                }
                if (collision.direction === 'top' || collision.direction === 'bottom') {
                    this.player.y = playerPrevY
                }
            }
        })
        
        // Uppdatera alla projektiler
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime)
            // Projektiler tar bort sig själva via maxDistance i Projectile.update()
        })
        
        // Ta bort markerade projektiler
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion)

        this.camera.follow(this.player)
        this.camera.update(deltaTime)
    }

    draw(ctx) {
        // Rita debug-grid om debug-läge är på
        if (this.inputHandler.debugMode) {
            this.drawDebugGrid(ctx)
        }
        
        // Rita arena (golv och väggar)
        this.arena.draw(ctx, this.camera)
        
        // Rita spelvärlden och objekt
        this.player.draw(ctx, this.camera)
        
        // Rita alla projektiler
        this.projectiles.forEach(projectile => {
            projectile.draw(ctx, this.camera)
        })
        
        // Rita UI (health, ammo, score)
        this.ui.draw(ctx)
    }
    
    // Rita ett 32x32 grid i världen
    drawDebugGrid(ctx) {
        const gridSize = 32
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 1
        
        // Beräkna vilka grid-linjer som är synliga på skärmen
        const startX = Math.floor(this.camera.x / gridSize) * gridSize
        const startY = Math.floor(this.camera.y / gridSize) * gridSize
        const endX = this.camera.x + this.width
        const endY = this.camera.y + this.height
        
        // Rita vertikala linjer
        for (let x = startX; x <= endX; x += gridSize) {
            const screenX = x - this.camera.x
            ctx.beginPath()
            ctx.moveTo(screenX, 0)
            ctx.lineTo(screenX, this.height)
            ctx.stroke()
        }
        
        // Rita horisontella linjer
        for (let y = startY; y <= endY; y += gridSize) {
            const screenY = y - this.camera.y
            ctx.beginPath()
            ctx.moveTo(0, screenY)
            ctx.lineTo(this.width, screenY)
            ctx.stroke()
        }
    }
}