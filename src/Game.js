import Rectangle from './Rectangle.js'
import InputHandler from './InputHandler.js'

export default class Game {
    constructor(width, height) {
        this.width = width
        this.height = height
        
        this.keys = new Set()
        this.input = new InputHandler(this)
        
        // Skapa alla objekt i spelet
        this.gameObjects = [
            new Rectangle(this, 50, 50, 100, 100, 'red'),
            new Rectangle(this, 200, 150, 150, 75, 'blue')
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

        // Exempel på input-hantering
        if (this.keys.has('r')) {
            this.gameObjects[0].vx += 0.001 * deltaTime
        }
        if (this.keys.has('b')) {
            this.gameObjects[1].vy -= 0.001 * deltaTime
        }
    }

    draw(ctx) {
        // Rita alla spelobjekt
        this.gameObjects.forEach(obj => obj.draw(ctx))
    }
}