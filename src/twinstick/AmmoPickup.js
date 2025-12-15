import GameObject from '../GameObject.js'

export default class AmmoPickup extends GameObject {
    constructor(game, x, y) {
        super(game, x, y, 16, 16)
        this.color = 'gold'
        this.ammoValue = 1 // Varje pickup ger 1 ammo
    }

    update(deltaTime) {
        // Ammo pickups är statiska, ingen uppdatering behövs
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x
        const screenY = this.y - camera.y

        // Rita en gul fyrkant med svart outline
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
        
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.strokeRect(screenX, screenY, this.width, this.height)
    }
}
