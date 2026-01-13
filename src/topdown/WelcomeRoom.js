import Room from './Room.js'

/**
 * Welcome Room - Starting room with no enemies
 * Simple tutorial/safe zone with single exit to the south
 */
export default class WelcomeRoom extends Room {
    constructor(game) {
        super(game, 'Welcome Room')
    }
    
    setup() {
        // Create checkerboard floor
        this.createFloor()
        
        // Create exit BEFORE walls so walls know where to create gaps
        this.createExit('south')
        
        // Create boundary walls with gap for exit
        this.createWalls()
        
        // Set player spawn in center of room
        this.playerSpawner = {
            x: this.width / 2 - 16, // Center - half player width
            y: this.height / 2 - 16  // Center - half player height
        }
        
        // No enemy spawners in welcome room
        this.enemySpawners = []
    }
}
