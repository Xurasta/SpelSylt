import GameBase from '../GameBase.js'
import TopDownPlayer from './TopDownPlayer.js'
import TopDownEnemy from './TopDownEnemy.js'
import Projectile from '../Projectile.js'
import WelcomeRoom from './WelcomeRoom.js'
import FightRoom from './FightRoom.js'

/**
 * Top-down game with room-based progression
 * Player moves through rooms, defeating enemies to unlock exits
 */
export default class TopDownGame extends GameBase {
    constructor(canvas) {
        super(canvas)

        // Lock camera to viewport (no scrolling)
        this.worldWidth = canvas.width
        this.worldHeight = canvas.height
        this.camera.setWorldBounds(this.worldWidth, this.worldHeight)
    
        // Game objects
        this.player = null
        this.projectiles = []
        this.room = null
        
        // Room system - hardcoded sequence
        this.roomClasses = [
            WelcomeRoom,
            FightRoom, // Will pass enemyCount in loadRoom
            FightRoom,
            FightRoom
        ]
        this.roomEnemyCounts = [0, 3, 5, 7] // Enemy count for each room
        this.currentRoomIndex = 0

        this.init()
    }

    init() {
        this.loadRoom(0)
    }
    
    restart() {
        // Reset to first room
        this.currentRoomIndex = 0
        this.loadRoom(0)
    }
    
    /**
     * Load a room by index
     */
    loadRoom(index) {
        if (index >= this.roomClasses.length) {
            console.log('🎉 YOU WIN! All rooms completed!')
            // For now just restart
            this.restart()
            return
        }
        
        this.currentRoomIndex = index
        
        // Clear existing arrays
        this.projectiles = []
        this.enemies = []
        
        // Create room instance
        const RoomClass = this.roomClasses[index]
        const enemyCount = this.roomEnemyCounts[index]
        
        if (RoomClass === WelcomeRoom) {
            this.room = new RoomClass(this)
        } else {
            this.room = new RoomClass(this, enemyCount)
        }
        
        // Get room data
        const roomData = this.room.getData()
        
        // Create player at room's spawn point
        this.player = new TopDownPlayer(
            this,
            roomData.playerSpawner.x,
            roomData.playerSpawner.y,
            32,
            32
        )
        
        console.log(`Loaded: ${this.room.name}`)
    }
    
    /**
     * Add projectile (called by player)
     */
    addProjectile(x, y, directionX, directionY) {
        const projectile = new Projectile(this, x, y, directionX, directionY)
        projectile.speed = 0.6
        projectile.color = 'yellow'
        projectile.width = 8
        projectile.height = 8
        this.projectiles.push(projectile)
    }

    update(deltaTime) {
        if (!this.room || !this.player) return
        
        // Update room (handles countdown and completion)
        this.room.update(deltaTime)
        
        // Spawn enemies if room countdown finished and not yet spawned
        if (this.room.hasSpawned && this.enemies.length === 0 && this.room.enemySpawners.length > 0) {
            const firstSpawn = this.room.enemies.length === 0
            if (firstSpawn) {
                this.room.enemySpawners.forEach(spawner => {
                    const enemy = new TopDownEnemy(this, spawner.x, spawner.y, 32, 32)
                    this.enemies.push(enemy)
                    this.room.enemies.push(enemy)
                })
            }
        }
        
        // Update player
        const playerPrevX = this.player.x
        const playerPrevY = this.player.y
        
        this.player.update(deltaTime)
        
        // Get room data for collision
        const roomData = this.room.getData()
        const allWalls = [...roomData.walls, ...roomData.obstacles]
        
        // Axis-separated collision for player vs walls
        const playerNewX = this.player.x
        const playerNewY = this.player.y
        
        // Test X-axis
        this.player.y = playerPrevY
        let hasXCollision = false
        for (const wall of allWalls) {
            if (this.player.intersects(wall)) {
                hasXCollision = true
                break
            }
        }
        if (hasXCollision) {
            this.player.x = playerPrevX
        }
        
        // Test Y-axis
        this.player.y = playerNewY
        let hasYCollision = false
        for (const wall of allWalls) {
            if (this.player.intersects(wall)) {
                hasYCollision = true
                break
            }
        }
        if (hasYCollision) {
            this.player.y = playerPrevY
        }
        
        // Check player collision with exits when room is complete
        if (this.room.isComplete) {
            for (const exit of roomData.exits) {
                if (this.player.intersects(exit)) {
                    this.loadRoom(this.currentRoomIndex + 1)
                    return // Exit early to avoid updating deleted objects
                }
            }
        }
        
        // Update projectiles
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime)
            
            // Collision with walls and obstacles
            for (const wall of allWalls) {
                if (projectile.intersects(wall)) {
                    projectile.markedForDeletion = true
                    break
                }
            }
        })
        
        // Remove deleted projectiles
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion)
        
        // Update enemies
        this.enemies.forEach(enemy => {
            const enemyPrevX = enemy.x
            const enemyPrevY = enemy.y
            
            enemy.update(deltaTime)
            
            // Collision with walls
            let hasCollision = false
            for (const wall of allWalls) {
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
            }
            
            // Collision with player
            if (enemy.intersects(this.player)) {
                enemy.attackPlayer(this.player)
            }
        })
        
        // Check projectile vs enemy collision
        this.projectiles.forEach(projectile => {
            this.enemies.forEach(enemy => {
                if (projectile.intersects(enemy)) {
                    enemy.takeDamage(1)
                    projectile.markedForDeletion = true
                }
            })
        })
        
        // Remove deleted projectiles and enemies
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion)
        this.enemies = this.enemies.filter(e => !e.markedForDeletion)
        
        // Update room's enemy array
        this.room.enemies = this.enemies
        
        // Check if player died
        if (this.player.markedForDeletion) {
            console.log('💀 Player died! Restarting from Room 1...')
            setTimeout(() => this.restart(), 1000)
        }
    }

    draw(ctx) {
        if (!this.room) return
        
        // Draw room (floor, walls, obstacles, exits)
        this.room.draw(ctx, this.camera)
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            enemy.draw(ctx, this.camera)
        })
        
        // Draw player
        if (this.player && !this.player.markedForDeletion) {
            this.player.draw(ctx, this.camera)
        }
        
        // Draw projectiles
        this.projectiles.forEach(projectile => {
            projectile.draw(ctx, this.camera)
        })
        
        // Draw UI overlay
        this.drawUI(ctx)
    }
    
    /**
     * Draw UI elements
     */
    drawUI(ctx) {
        // Draw room name
        ctx.fillStyle = 'white'
        ctx.font = '20px Arial'
        ctx.fillText(this.room.name, 10, 30)
        
        // Draw health
        if (this.player) {
            ctx.fillText(`Health: ${this.player.health}/${this.player.maxHealth}`, 10, 60)
        }
        
        // Draw countdown if still spawning
        if (!this.room.hasSpawned && this.room.spawnCountdown > 0) {
            const seconds = Math.ceil(this.room.spawnCountdown / 1000)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.font = '48px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(seconds, this.width / 2, this.height / 2)
            ctx.textAlign = 'left'
        }
        
        // Draw room completion status
        if (this.room.isComplete) {
            ctx.fillStyle = '#00ff00'
            ctx.font = '16px Arial'
            ctx.fillText('Room Complete! Find the exit!', 10, 90)
        }
    }
}
