import GameBase from "../GameBase.js"
import TwinstickPlayer from "./TwinstickPlayer.js"
import Projectile from "../Projectile.js"
import TwinstickArena from "./TwinstickArena.js"
import TwinstickEnemy from "./TwinstickEnemy.js"
import AmmoPickup from "./AmmoPickup.js"

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
        this.enemyProjectiles = []
        this.ammoPickups = []
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
        
        // Skapa några fiender
        this.spawnEnemy(200, 200)
        this.spawnEnemy(this.worldWidth - 250, 200)
        this.spawnEnemy(this.worldWidth / 2, this.worldHeight - 200)
    }
    
    spawnEnemy(x, y) {
        const enemy = new TwinstickEnemy(this, x, y, 32, 32)
        this.enemies.push(enemy)
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
    
    addEnemyProjectile(x, y, directionX, directionY) {
        // Skapa fiendens projektil
        const projectile = new Projectile(this, x, y, directionX, directionY)
        projectile.speed = 0.3 // Mycket långsammare än spelarens projektiler
        projectile.color = 'red'
        projectile.width = 8
        projectile.height = 8
        this.enemyProjectiles.push(projectile)
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
            
            // Kolla kollision mellan projektiler och väggar
            arenaData.walls.forEach(wall => {
                if (projectile.intersects(wall)) {
                    projectile.markedForDeletion = true
                }
            })
        })
        
        // Ta bort markerade projektiler
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion)
        
        // Uppdatera fiender
        this.enemies.forEach(enemy => {
            const enemyPrevX = enemy.x
            const enemyPrevY = enemy.y
            
            enemy.update(deltaTime)
            
            // Kolla kollision mellan fiender och väggar
            let hasCollision = false
            arenaData.walls.forEach(wall => {
                const collision = enemy.getCollisionData(wall)
                if (collision) {
                    hasCollision = true
                    if (collision.direction === 'left' || collision.direction === 'right') {
                        enemy.x = enemyPrevX
                    }
                    if (collision.direction === 'top' || collision.direction === 'bottom') {
                        enemy.y = enemyPrevY
                    }
                }
            })
            
            // Om fienden kolliderar under SEEK-läge, försök hitta en väg runt
            if (hasCollision && enemy.state === 'seek') {
                enemy.handleWallAvoidance(deltaTime)
            }
        })
        
        // Uppdatera fiendens projektiler
        this.enemyProjectiles.forEach(projectile => {
            projectile.update(deltaTime)
            
            // Kolla kollision med väggar
            arenaData.walls.forEach(wall => {
                if (projectile.intersects(wall)) {
                    projectile.markedForDeletion = true
                }
            })
            
            if (projectile.intersects(this.player)) {
                if (!this.player.isInvulnerable) {
                    this.player.takeDamage(1)
                }
                projectile.markedForDeletion = true
            }
        })
        
        // Kolla kollision mellan spelarens projektiler och fiender
        this.projectiles.forEach(projectile => {
            this.enemies.forEach(enemy => {
                if (projectile.intersects(enemy)) {
                    let dead = enemy.takeDamage(1)
                    projectile.markedForDeletion = true

                    if (dead) {
                        // Spawna ammo pickups baserat på fiendens health
                        const ammoCount = enemy.maxHealth // Använd maxHealth för att få rätt antal
                        for (let i = 0; i < ammoCount; i++) {
                            // Sprid ut pickups slumpmässigt runt fienden
                            const angle = Math.random() * Math.PI * 2
                            const radius = 15 + Math.random() * 20 // 15-35px från centrum
                            const pickupX = enemy.x + enemy.width / 2 + Math.cos(angle) * radius
                            const pickupY = enemy.y + enemy.height / 2 + Math.sin(angle) * radius
                            const pickup = new AmmoPickup(this, pickupX, pickupY)
                            this.ammoPickups.push(pickup)
                        }
                    }
                }
            })
        })
        
        // Ta bort markerade fiendens projektiler
        this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.markedForDeletion)
        
        // Ta bort döda fiender
        this.enemies = this.enemies.filter(e => !e.markedForDeletion)
        
        // Kolla kollision mellan spelare och ammo pickups
        this.ammoPickups.forEach(pickup => {
            if (this.player.intersects(pickup)) {
                this.player.addAmmo(pickup.ammoValue)
                pickup.markedForDeletion = true
            }
        })
        
        // Ta bort uppplockade ammo pickups
        this.ammoPickups = this.ammoPickups.filter(p => !p.markedForDeletion)

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
        
        // Rita fiender
        this.enemies.forEach(enemy => {
            enemy.draw(ctx, this.camera)
        })
        
        // Rita alla projektiler
        this.projectiles.forEach(projectile => {
            projectile.draw(ctx, this.camera)
        })
        
        // Rita fiendens projektiler
        this.enemyProjectiles.forEach(projectile => {
            projectile.draw(ctx, this.camera)
        })
        
        // Rita ammo pickups
        this.ammoPickups.forEach(pickup => {
            pickup.draw(ctx, this.camera)
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