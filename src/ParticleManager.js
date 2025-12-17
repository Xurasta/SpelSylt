// src/ParticleManager.js
export default class ParticleManager {
    constructor(game, maxParticles = 200) {
        this.game = game
        this.maxParticles = maxParticles
        this.particles = []
        this.pools = new Map() // Map av ParticleClass -> pool array
    }

    /**
     * Hämta eller skapa en pool för en specifik partikelklass
     */
    getPool(ParticleClass) {
        if (!this.pools.has(ParticleClass)) {
            this.pools.set(ParticleClass, {
                available: [],
                active: []
            })
        }
        return this.pools.get(ParticleClass)
    }

    /**
     * Spawna en partikel (från pool om möjligt)
     */
    spawn(ParticleClass, x, y, config = {}) {
        // Kolla om vi har nått max-gränsen
        if (this.particles.length >= this.maxParticles) {
            return null;
        }

        const pool = this.getPool(ParticleClass)
        let particle

        // Försök återanvända en partikel från poolen
        if (pool.available.length > 0) {
            particle = pool.available.pop()
            particle.reset(this.game, x, y, config)
        } else {
            // Skapa ny partikel
            particle = new ParticleClass(this.game, x, y, config)
        }

        pool.active.push(particle)
        this.particles.push(particle)
        return particle
    }

    /**
     * Uppdatera alla partiklar
     */
    update(deltaTime) {
        // Använd reverse loop för att kunna ta bort under iteration
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i]
            particle.update(deltaTime)

            // Om partikeln är markerad för borttagning, återvinn den
            if (particle.markedForDeletion) {
                this.recycle(particle, i)
            }
        }
    }

    /**
     * Rita alla partiklar med camera culling
     */
    draw(ctx, camera = null) {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i]
            
            // Endast rita om partikeln är synlig i kameran
            if (!camera || camera.isVisible(particle)) {
                particle.draw(ctx, camera)
            }
        }
    }

    /**
     * Återvinn en partikel till poolen
     */
    recycle(particle, index) {
        // Ta bort från aktiva listan
        this.particles.splice(index, 1)

        // Hitta rätt pool och flytta partikeln dit
        for (const [ParticleClass, pool] of this.pools) {
            const activeIndex = pool.active.indexOf(particle)
            if (activeIndex !== -1) {
                pool.active.splice(activeIndex, 1)
                pool.available.push(particle)
                break
            }
        }
    }

    /**
     * Rensa alla partiklar
     */
    clear() {
        // Flytta alla aktiva partiklar tillbaka till poolen
        for (const particle of this.particles) {
            for (const [ParticleClass, pool] of this.pools) {
                const activeIndex = pool.active.indexOf(particle)
                if (activeIndex !== -1) {
                    pool.active.splice(activeIndex, 1)
                    pool.available.push(particle)
                    break
                }
            }
        }
        this.particles = []
    }

    /**
     * Debug info
     */
    getStats() {
        let totalPooled = 0
        let totalActive = 0
        
        for (const [ParticleClass, pool] of this.pools) {
            totalPooled += pool.available.length
            totalActive += pool.active.length
        }

        return {
            active: this.particles.length,
            pooled: totalPooled,
            pools: this.pools.size,
            maxParticles: this.maxParticles
        };
    }
}
