import Vector2 from './Vector2.js'

export default class Camera {
    constructor(x = 0, y = 0, width = 800, height = 600) {
        this.position = new Vector2(x, y)
        this.width = width
        this.height = height
        
        // World bounds (nivåns storlek)
        this.worldWidth = width
        this.worldHeight = height
        
        // Smooth following
        this.smoothing = 0.1 // 0-1, högre = snabbare följning
        this.target = new Vector2(x, y)
    }
    
    setWorldBounds(width, height) {
        this.worldWidth = width
        this.worldHeight = height
    }
    
    follow(target) {
        // Beräkna spelarens position relativt till kamerans centrum
        const targetCenterX = target.position.x + target.width / 2
        const targetCenterY = target.position.y + target.height / 2
        
        // Centrera kameran på spelaren
        this.target.x = targetCenterX - this.width / 2
        this.target.y = targetCenterY - this.height / 2
        
        // Clamp till world bounds
        this.target.x = Math.max(0, Math.min(this.target.x, this.worldWidth - this.width))
        this.target.y = Math.max(0, Math.min(this.target.y, this.worldHeight - this.height))
    }
    
    update(deltaTime) {
        // Smooth lerp till target position
        this.position.x += (this.target.x - this.position.x) * this.smoothing
        this.position.y += (this.target.y - this.position.y) * this.smoothing
        
        // Avrunda för att undvika pixel-jitter
        this.position.x = Math.round(this.position.x)
        this.position.y = Math.round(this.position.y)
    }
    
    // Konvertera world coordinates till screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.position.x,
            y: worldY - this.position.y
        }
    }
    
    // Konvertera screen coordinates till world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.position.x,
            y: screenY + this.position.y
        }
    }
    
    // Kolla om ett objekt är synligt på skärmen
    isVisible(object) {
        return !(object.position.x + object.width < this.position.x ||
                object.position.x > this.position.x + this.width ||
                object.position.y + object.height < this.position.y ||
                object.position.y > this.position.y + this.height)
    }
}
