import Particle from './Particle.js';

export class Dust extends Particle {
    constructor(game = null, x = 0, y = 0, config = {}) {
        super(game, x, y);
        this.reset(game, x, y, config);
    }

    reset(game, x, y, config = {}) {
        super.reset(game, x, y);
        this.config = config;
        
        // Konfigurerbar storlek
        this.size = this.config.size ?? (Math.random() * 5 + 5);
        this.initialSize = this.size;
        
        // Små slumpmässiga rörelser för att dammet inte ska vara helt statiskt
        this.speedX = this.config.speedX ?? (Math.random() * 0.02 - 0.01);
        this.speedY = this.config.speedY ?? (-Math.random() * 0.05);
        
        // Konfigurerbar färg
        this.color = this.config.color ?? 'rgba(200, 200, 200, 0.3)';
        
        // Dust-specifikt: krymphastighet
        this.shrinkRate = this.config.shrinkRate ?? 0.95;
    }
    
    update(deltaTime) {
        // Kör base class update (rörelse)
        super.update(deltaTime);
        
        // Dust-specifikt beteende: krymp över tid
        this.size *= Math.pow(this.shrinkRate, deltaTime / 16);
        
        // Dö om för liten eller utanför skärmen
        if (this.size < 0.5 || this.isOffScreen()) {
            this.markedForDeletion = true;
        }
    }
}