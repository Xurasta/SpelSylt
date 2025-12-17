// src/Particle.js
/**
 * Abstract base class för partiklar
 * Måste extendera och implementera reset() i subklasser
 */
export default class Particle {
    constructor(game = null, x = 0, y = 0) {
        // Förhindra direkt instansiering av Particle
        if (new.target === Particle) {
            throw new Error('Particle är en abstract class och kan inte instansieras direkt')
        }
        this.reset(game, x, y);
    }

    reset(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.markedForDeletion = false;
        
        // Lifecycle tracking
        this.age = 0;
        this.maxAge = Infinity; // Subklasser kan sätta en gräns
        
        // Subklasser måste sätta dessa i sin reset()
        this.speedX = 0;
        this.speedY = 0;
        this.size = 0;
        this.initialSize = 0;
        this.color = 'white';
    }

    update(deltaTime) {
        // Uppdatera ålder
        this.age += deltaTime;
        
        // Kolla om partikeln har levt för länge
        if (this.age >= this.maxAge) {
            this.markedForDeletion = true;
        }
        
        // Flytta partikeln (normaliserad för deltaTime)
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
        
        // Subklasser kan override för att lägga till custom beteende
    }

    draw(ctx, camera = null) {
        // Beräkna screen position (om camera finns)
        const screenX = camera ? this.x - camera.x : this.x;
        const screenY = camera ? this.y - camera.y : this.y;
        
        // Optimerad rendering utan save/restore
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Helper methods som subklasser kan använda
    
    /**
     * Kolla om partikeln är utanför world bounds
     */
    isOffScreen() {
        if (!this.game) return false;
        
        const margin = this.size * 2; // Extra marginal
        return (
            this.x < -margin || 
            this.x > this.game.worldWidth + margin ||
            this.y < -margin ||
            this.y > this.game.worldHeight + margin
        );
    }
    
    /**
     * Beräkna progress (0-1) baserat på ålder
     */
    getLifetimeProgress() {
        if (this.maxAge === Infinity) return 0;
        return Math.min(this.age / this.maxAge, 1);
    }

    // Check if particle has width/height for camera culling
    get width() { return this.size * 2; }
    get height() { return this.size * 2; }
}