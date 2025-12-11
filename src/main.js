import './style.css'
import SpaceShooterGame from './spaceshooter/SpaceShooterGame.js'

const setupGame = (canvas) => {
    // Sätt storlek på canvas 480x854 (9:16 vertical)
    canvas.width = 480
    canvas.height = 854
    // ctx är "ritkontexten", används för att rita på canvas
    const ctx = canvas.getContext('2d')

    // Skapa space shooter spelet
    const game = new SpaceShooterGame(canvas.width, canvas.height)
    let lastTime = 0
    // Game loop variabel så att vi kan stoppa den senare om vi vill
    let gameLoop

    const runGame = (timeStamp) => {
        // Förhindra för stora deltaTime värden (första frame, tab-switch, etc)
        if (lastTime === 0) {
            lastTime = timeStamp
        }
        const deltaTime = timeStamp - lastTime
        lastTime = timeStamp
        
        // Säkerhets-cap för deltaTime (max 100ms)
        const cappedDeltaTime = Math.min(deltaTime, 100)
        
        // Rensa canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Uppdatera och rita
        game.update(cappedDeltaTime)
        game.draw(ctx)
        
        // Kör nästa frame
        gameLoop = requestAnimationFrame(runGame)
    }
    
    // Starta game loop
    gameLoop = requestAnimationFrame(runGame)
}

// Kör igång spelet
setupGame(document.querySelector('#game'))