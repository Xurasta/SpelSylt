import Player from './Player.js'
import InputHandler from './InputHandler.js'
import Rectangle from './Rectangle.js'

export default class Game {
    constructor(width, height) {
        this.width = width
        this.height = height

        this.inputHandler = new InputHandler(this)

        this.player = new Player(this, 50, 50, 50, 50, 'green')

        // Skapa alla objekt i spelet
        this.gameObjects = [
            new Rectangle(this, 200, 150, 50, 50, 'red')
        ]

        // Sätt starthastighet (pixlar per millisekund)
        // this.gameObjects[0].vx = 0.1
        // this.gameObjects[0].vy = 0.05
        // this.gameObjects[1].vx = -0.08
        // this.gameObjects[1].vy = 0.12
    }

    update(deltaTime) {
        // Uppdatera spelet utifrån deltaTime
        this.gameObjects.forEach(obj => obj.update(deltaTime))
        this.player.update(deltaTime)

        // Exempel på input-hantering
        if (this.inputHandler.keys.has('r')) {
            this.gameObjects[0].vx += 0.001 * deltaTime
        }
        if (this.inputHandler.keys.has('b')) {
            this.gameObjects[1].vy -= 0.001 * deltaTime
        }

        this.gameObjects.forEach(obj => {
            if (obj !== this.player && this.player.intersects(obj)) {
                // Hantera kollision baserat på riktning
                if (this.player.directionX > 0) { // rör sig åt höger
                    this.player.x = obj.x - this.player.width
                } else if (this.player.directionX < 0) { // rör sig åt vänster
                    this.player.x = obj.x + obj.width
                }
                if (this.player.directionY > 0) { // rör sig neråt
                    this.player.y = obj.y - this.player.height
                } else if (this.player.directionY < 0) { // rör sig uppåt
                    this.player.y = obj.y + obj.height
                }
            }
        })
    }

    draw(ctx) {
        // Rita alla spelobjekt
        this.gameObjects.forEach(obj => obj.draw(ctx))
        this.player.draw(ctx)
    }
}