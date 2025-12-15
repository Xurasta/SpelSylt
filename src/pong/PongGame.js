import GameBase from '../GameBase.js'
import Paddle from './Paddle.js'
import Ball from './Ball.js'

export default class PongGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        // Pong-specifikt: 2 spelare
        this.player1Score = 0
        this.player2Score = 0
        this.winScore = 5  // Första till 5 vinner
        
        this.init()
    }
    
    init() {
        const paddleWidth = 15
        const paddleHeight = 80
        const margin = 30
        
        // Skapa paddlar
        this.paddle1 = new Paddle(
            this, 
            margin, 
            this.height / 2 - paddleHeight / 2,
            paddleWidth,
            paddleHeight,
            'w', 's'  // Tangenter för player 1
        )
        
        this.paddle2 = new Paddle(
            this,
            this.width - margin - paddleWidth,
            this.height / 2 - paddleHeight / 2,
            paddleWidth,
            paddleHeight,
            'ArrowUp', 'ArrowDown'  // Tangenter för player 2
        )
        
        // Skapa boll
        this.ball = new Ball(this, this.width/2, this.height/2, 15, 15)
        
        this.gameState = 'PLAYING'
    }
    
    restart() {
        this.player1Score = 0
        this.player2Score = 0
        this.init()
    }
    
    update(deltaTime) {
        if (this.gameState !== 'PLAYING') return
        
        // Uppdatera objekt
        this.paddle1.update(deltaTime)
        this.paddle2.update(deltaTime)
        this.ball.update(deltaTime)
        
        // Kollision: Ball mot paddlar
        if (this.checkCollision(this.ball, this.paddle1) ||
            this.checkCollision(this.ball, this.paddle2)) {
            this.ball.bounceOffPaddle()
        }
        
        // Mål detection
        if (this.ball.x < 0) {
            // Player 2 poäng
            this.player2Score++
            this.ball.reset()
            if (this.player2Score >= this.winScore) {
                this.gameState = 'GAME_OVER'
            }
        } else if (this.ball.x > this.width) {
            // Player 1 poäng
            this.player1Score++
            this.ball.reset()
            if (this.player1Score >= this.winScore) {
                this.gameState = 'GAME_OVER'
            }
        }
    }
    
    draw(ctx) {
        // Svart bakgrund
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, this.width, this.height)
        
        // Mittlinje (dashed)
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2
        ctx.setLineDash([10, 10])
        ctx.beginPath()
        ctx.moveTo(this.width / 2, 0)
        ctx.lineTo(this.width / 2, this.height)
        ctx.stroke()
        ctx.setLineDash([])
        
        // Rita objekt
        this.paddle1.draw(ctx)
        this.paddle2.draw(ctx)
        this.ball.draw(ctx)
        
        // Score
        ctx.fillStyle = '#fff'
        ctx.font = '48px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(this.player1Score, this.width/4, 60)
        ctx.fillText(this.player2Score, this.width*3/4, 60)
        
        if (this.gameState === 'GAME_OVER') {
            ctx.fillText('GAME OVER', this.width/2, this.height/2)
            ctx.font = '24px monospace'
            ctx.fillText('Press SPACE to restart', this.width/2, this.height/2 + 40)
            
            if (this.inputHandler.keys.has(' ')) {
                this.restart()
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y
    }
}
