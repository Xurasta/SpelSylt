import Platform from '../Platform.js'
import Exit from './Exit.js'
import TopDownEnemy from './TopDownEnemy.js'

/**
 * Abstract base class for all rooms in the top-down game
 * Each room is a boxed arena with floor, walls, obstacles, and exits
 * Subclasses define specific layouts and enemy configurations
 */
export default class Room {
    constructor(game, name) {
        // Prevent direct instantiation of Room
        if (new.target === Room) {
            throw new Error('Room is an abstract class and cannot be instantiated directly')
        }
        
        this.game = game
        this.name = name
        this.width = game.worldWidth
        this.height = game.worldHeight
        this.tileSize = 64
        
        // Visual elements
        this.floor = []
        this.walls = []
        this.obstacles = []
        
        // Spawn configurations
        this.playerSpawner = { x: 0, y: 0 }
        this.enemySpawners = []
        
        // Exit system - array of Exit objects positioned at walls
        this.exits = []
        this.exitDirections = [] // Track which directions have exits for wall creation
        
        // Room state
        this.isComplete = false
        this.spawnCountdown = 2500 // 2.5 seconds delay before spawning enemies
        this.hasSpawned = false
        
        // Enemies spawned in this room
        this.enemies = []
    }
    
    /**
     * Abstract method - must be implemented by subclasses
     * Sets up floor, walls, obstacles, spawners, and exits
     */
    setup() {
        throw new Error('setup() must be implemented by subclass')
    }
    
    /**
     * Update room logic each frame
     * Handles spawn countdown and room completion
     */
    update(deltaTime) {
        // Countdown to spawn enemies
        if (!this.hasSpawned && this.spawnCountdown > 0) {
            this.spawnCountdown -= deltaTime
            if (this.spawnCountdown <= 0) {
                this.spawnEnemies()
                this.hasSpawned = true
            }
        }
//        console.log(this.enemies.length, this.enemySpawners.length, this.hasSpawned, this.isComplete)
        // Check if room is complete (all enemies defeated)
        if (this.hasSpawned && !this.isComplete) {
            if (this.enemies.length === 0 && this.enemySpawners.length > 0) {
                this.isComplete = true
                this.onComplete()
            } else if (this.enemySpawners.length === 0) {
                // Room with no enemies is instantly complete
                this.isComplete = true
            }
        }
    }
    
    /**
     * Spawn all enemies simultaneously after countdown
     * Called automatically by update() after countdown
     * Subclasses can override to spawn different enemy types
     */
    spawnEnemies() {
        // Create enemies at each spawn point
        this.enemySpawners.forEach(spawner => {
            const enemy = new TopDownEnemy(this.game, spawner.x, spawner.y, 32, 32)
            this.enemies.push(enemy)
            this.game.enemies.push(enemy)
        })
    }
    
    /**
     * Called when room is completed (all enemies defeated)
     * Unlocks exits (changes color and allows passage)
     */
    onComplete() {
        this.exits.forEach(exit => {
            exit.unlock()
        })
    }
    
    /**
     * Draw room elements
     */
    draw(ctx, camera) {
        // Draw floor tiles
        this.floor.forEach(tile => {
            const screenX = camera ? tile.x - camera.x : tile.x
            const screenY = camera ? tile.y - camera.y : tile.y
            
            ctx.fillStyle = tile.color
            ctx.fillRect(screenX, screenY, tile.width, tile.height)
        })
        
        // Draw walls
        this.walls.forEach(wall => {
            wall.draw(ctx, camera)
        })
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.draw(ctx, camera)
        })
        
        // Draw exits
        this.exits.forEach(exit => {
            exit.draw(ctx, camera)
        })
    }
    
    /**
     * Get room data for game to use
     * Similar to TwinstickArena.getData()
     */
    getData() {
        return {
            walls: this.walls,
            obstacles: this.obstacles,
            exits: this.exits,
            playerSpawner: this.playerSpawner,
            enemySpawners: this.enemySpawners,
            isComplete: this.isComplete
        }
    }
    
    /**
     * Helper method to create checkerboard floor pattern
     */
    createFloor() {
        const tilesX = Math.ceil(this.width / this.tileSize)
        const tilesY = Math.ceil(this.height / this.tileSize)
        
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const isLight = (x + y) % 2 === 0
                const color = isLight ? '#2a2a2a' : '#222222'
                
                this.floor.push({
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize,
                    color: color
                })
            }
        }
    }
    
    /**
     * Helper method to create boundary walls around room
     * Creates gaps where exits are positioned
     */
    createWalls() {
        const wallThickness = this.tileSize
        const wallColor = '#666666'
        const exitSize = this.tileSize * 2
        
        // Check which directions have exits
        const hasNorthExit = this.exitDirections.includes('north')
        const hasSouthExit = this.exitDirections.includes('south')
        const hasEastExit = this.exitDirections.includes('east')
        const hasWestExit = this.exitDirections.includes('west')
        
        // Top wall - create gap if north exit exists
        if (hasNorthExit) {
            const exitStart = (this.width - exitSize) / 2
            // Left section
            this.walls.push(new Platform(this.game, 0, 0, exitStart, wallThickness, wallColor))
            // Right section
            this.walls.push(new Platform(this.game, exitStart + exitSize, 0, this.width - (exitStart + exitSize), wallThickness, wallColor))
        } else {
            this.walls.push(new Platform(this.game, 0, 0, this.width, wallThickness, wallColor))
        }
        
        // Bottom wall - create gap if south exit exists
        if (hasSouthExit) {
            const exitStart = (this.width - exitSize) / 2
            // Left section
            this.walls.push(new Platform(this.game, 0, this.height - wallThickness, exitStart, wallThickness, wallColor))
            // Right section
            this.walls.push(new Platform(this.game, exitStart + exitSize, this.height - wallThickness, this.width - (exitStart + exitSize), wallThickness, wallColor))
        } else {
            this.walls.push(new Platform(this.game, 0, this.height - wallThickness, this.width, wallThickness, wallColor))
        }
        
        // Left wall - create gap if west exit exists
        if (hasWestExit) {
            const exitStart = (this.height - exitSize) / 2
            // Top section
            this.walls.push(new Platform(this.game, 0, 0, wallThickness, exitStart, wallColor))
            // Bottom section
            this.walls.push(new Platform(this.game, 0, exitStart + exitSize, wallThickness, this.height - (exitStart + exitSize), wallColor))
        } else {
            this.walls.push(new Platform(this.game, 0, 0, wallThickness, this.height, wallColor))
        }
        
        // Right wall - create gap if east exit exists
        if (hasEastExit) {
            const exitStart = (this.height - exitSize) / 2
            // Top section
            this.walls.push(new Platform(this.game, this.width - wallThickness, 0, wallThickness, exitStart, wallColor))
            // Bottom section
            this.walls.push(new Platform(this.game, this.width - wallThickness, exitStart + exitSize, wallThickness, this.height - (exitStart + exitSize), wallColor))
        } else {
            this.walls.push(new Platform(this.game, this.width - wallThickness, 0, wallThickness, this.height, wallColor))
        }
    }
    
    /**
     * Helper method to create exit at specific wall position
     * Must be called BEFORE createWalls() so walls know where to create gaps
     * @param {string} direction - 'north', 'south', 'east', 'west'
     */
    createExit(direction) {
        // Track exit direction for wall creation
        this.exitDirections.push(direction)
        
        const exitSize = this.tileSize * 2 // Exit is 2 tiles wide/tall
        const wallThickness = this.tileSize
        
        let exit
        
        switch(direction) {
            case 'north':
                exit = new Exit(
                    this.game,
                    (this.width - exitSize) / 2,
                    0,
                    exitSize,
                    wallThickness
                )
                break
            case 'south':
                exit = new Exit(
                    this.game,
                    (this.width - exitSize) / 2,
                    this.height - wallThickness,
                    exitSize,
                    wallThickness
                )
                break
            case 'east':
                exit = new Exit(
                    this.game,
                    this.width - wallThickness,
                    (this.height - exitSize) / 2,
                    wallThickness,
                    exitSize
                )
                break
            case 'west':
                exit = new Exit(
                    this.game,
                    0,
                    (this.height - exitSize) / 2,
                    wallThickness,
                    exitSize
                )
                break
            default:
                throw new Error(`Invalid exit direction: ${direction}`)
        }
        
        this.exits.push(exit)
    }
}