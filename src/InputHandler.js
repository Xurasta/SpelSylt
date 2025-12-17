export default class InputHandler {
    constructor(game) {
        this.game = game
        this.keys = new Set()
        
        window.addEventListener('keydown', (event) => {
            console.log(event.key)
            this.keys.add(event.key)
            
            // Hantera one-time key presses
            // R för restart
            if (event.key === 'r' || event.key === 'R') {
                if (this.game.gameState === 'GAME_OVER' || this.game.gameState === 'WIN') {
                    this.game.restart()
                }
            }
            
            // P för particle debug toggle
            if (event.key === 'p' || event.key === 'P') {
                this.game.debug = !this.game.debug
            }
        })
        
        window.addEventListener('keyup', (event) => {
            this.keys.delete(event.key)
        })
    }
}