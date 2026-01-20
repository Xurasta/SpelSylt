import GameObject from './GameObject.js'
import dingSound from './assets/sounds/ding-402325.mp3'

export default class Coin extends GameObject {
    constructor(game, x, y, size = 20, value = 10) {
        super(game, x, y, size, size)
        this.size = size
        this.color = 'yellow'
        this.value = value // Poäng för detta mynt
        
        // Bob animation
        this.bobOffset = 0
        this.bobSpeed = 0.006 // hur snabbt myntet gungar
        this.bobDistance = 5 // hur långt upp/ner myntet rör sig
        
        // Sound
        this.sound = new Audio(dingSound)
        this.sound.volume = 0.3 // Sänk volymen lite
    }

    update(deltaTime) {
        // Gungar myntet upp och ner
        this.bobOffset += this.bobSpeed * deltaTime
    }
    
    collect() {
        this.markedForDeletion = true
        // Spela ljud
        this.sound.currentTime = 0 // Reset så det kan spelas flera gånger snabbt
        this.sound.play().catch(e => console.log('Coin sound play failed:', e))
    }

    draw(ctx, camera = null) {
        // Beräkna screen position (om camera finns)
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Beräkna y-position med bob
        const bobY = Math.sin(this.bobOffset) * this.bobDistance
        // Rita myntet som en cirkel
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(screenX + this.size / 2, screenY + this.size / 2 + bobY, this.size / 2, 0, Math.PI * 2)
        ctx.fill()
    }
}
