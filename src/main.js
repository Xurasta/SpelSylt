import './style.css'
import PongGame from './pong/PongGame.js'

const setupGame = (canvas) => {
    // Sätt storlek på canvas 800x600 (4:3 - klassiskt för Pong)
    canvas.width = 800
    canvas.height = 600
    // ctx är "ritkontexten", används för att rita på canvas
    const ctx = canvas.getContext('2d')

    // Skapa Pong-spelet
    const game = new PongGame(canvas.width, canvas.height)
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