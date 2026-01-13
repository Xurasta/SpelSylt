import Room from './Room.js'
import Platform from '../Platform.js'

/**
 * Fight Room - Combat room with enemies
 * Enemies spawn after countdown, exit opens when all defeated
 */
export default class FightRoom extends Room {
    constructor(game, enemyCount = 3) {
        super(game, `Fight Room (${enemyCount} enemies)`)
        this.enemyCount = enemyCount
    }
    
    setup() {
        // Create checkerboard floor
        this.createFloor()
        
        // Create exit BEFORE walls so walls know where to create gaps
        this.createExit('east')
        
        // Create boundary walls with gap for exit
        this.createWalls()
        
        // Set player spawn in center-left of room
        this.playerSpawner = {
            x: this.width / 4 - 16,
            y: this.height / 2 - 16
        }
        
        // Create enemy spawn points distributed around the room
        this.createEnemySpawners()
        
        // Add some obstacles for variety
        this.createObstacles()
    }
    
    /**
     * Create enemy spawn points distributed around the room
     */
    createEnemySpawners() {
        const margin = this.tileSize * 2
        const roomCenterX = this.width / 2
        const roomCenterY = this.height / 2
        
        // Distribute enemies in a circle around center-right area
        const spawnCenterX = this.width * 0.7
        const spawnCenterY = this.height / 2
        const spawnRadius = this.tileSize * 2
        
        for (let i = 0; i < this.enemyCount; i++) {
            const angle = (i / this.enemyCount) * Math.PI * 2
            const x = spawnCenterX + Math.cos(angle) * spawnRadius
            const y = spawnCenterY + Math.sin(angle) * spawnRadius
            
            this.enemySpawners.push({ x, y })
        }
    }
    
    /**
     * Create some obstacles for tactical gameplay
     */
    createObstacles() {
        // Add a couple of blocks for cover/obstacles
        const blockSize = this.tileSize
        const blockColor = '#555555'
        
        // Only add obstacles if room is large enough
        if (this.width > 500 && this.height > 400) {
            // Center obstacle
            this.obstacles.push(new Platform(
                this.game,
                this.width / 2 - blockSize / 2,
                this.height / 2 - blockSize / 2,
                blockSize,
                blockSize,
                blockColor
            ))
            
            // Top-right obstacle
            this.obstacles.push(new Platform(
                this.game,
                this.width * 0.65,
                this.height * 0.3,
                blockSize,
                blockSize,
                blockColor
            ))
            
            // Bottom-right obstacle
            this.obstacles.push(new Platform(
                this.game,
                this.width * 0.65,
                this.height * 0.7,
                blockSize,
                blockSize,
                blockColor
            ))
        }
    }
}
