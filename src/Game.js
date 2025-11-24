import Rectangle from './Rectangle.js'
import InputHandler from './InputHandler.js'

export default class Game {
    constructor(width, height) {
        this.width = width
        this.height = height
        
        this.inputHandler = new InputHandler(this)
        
        // Skapa alla objekt i spelet
        this.gameObjects = [
            new Rectangle(this, 50, 50, 100, 100, 'red'),
            new Rectangle(this, 200, 150, 150, 75, 'blue')
        ]
    }

    update(deltaTime) {
        // Uppdatera spelet utifrån deltaTime
        this.gameObjects.forEach(obj => obj.update(deltaTime))

        // Exempel på input-hantering
        if (this.inputHandler.keys.has('r')) {
            this.gameObjects[0].velocityX += 0.001 * deltaTime
        }
        if (this.inputHandler.keys.has('b')) {
            this.gameObjects[1].velocityY -= 0.001 * deltaTime
        }
    }

    draw(ctx) {
        // Rita alla spelobjekt
        this.gameObjects.forEach(obj => obj.draw(ctx))
    }
}