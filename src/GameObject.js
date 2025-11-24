export default class GameObject {
    constructor(game, x = 0, y = 0, width = 0, height = 0) {
        this.game = game
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        
        // State
        this.active = true
        this.visible = true
    }

    draw(ctx) {
        // Override this method in subclasses
    }

    // kollision, funkar för rektanglar
    intersects(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y
    }
}
