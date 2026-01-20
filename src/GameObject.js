// Basklass för alla objekt i spelet
export default class GameObject {
    constructor(game, x = 0, y = 0, width = 0, height = 0) {
        this.game = game // referens till spelet
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.markedForDeletion = false
        
        // Animation properties (optional - används endast om subklasser har sprites)
        this.animations = null
        this.currentAnimation = null
        this.frameIndex = 0
        this.frameTimer = 0
        this.frameInterval = 100 // millisekunder per frame
        this.spriteLoaded = false
    }

    draw(ctx, camera = null) {
        // Gör inget, implementera i subklasser
    }

    // Kolla om detta objekt kolliderar med ett annat
    // AABB kollision - funkar för rektanglar
    intersects(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y
    }

    // Returnerar kollisionsdata med riktning
    getCollisionData(other) {
        if (!this.intersects(other)) return null
        
        // Beräkna överlappning från varje riktning
        const overlapLeft = (this.x + this.width) - other.x
        const overlapRight = (other.x + other.width) - this.x
        const overlapTop = (this.y + this.height) - other.y
        const overlapBottom = (other.y + other.height) - this.y
        
        // Hitta minsta överlappningen för att bestämma riktning
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)
        
        // Bestäm riktning baserat på minsta överlappningen
        if (minOverlap === overlapTop) return { direction: 'top' }
        if (minOverlap === overlapBottom) return { direction: 'bottom' }
        if (minOverlap === overlapLeft) return { direction: 'left' }
        if (minOverlap === overlapRight) return { direction: 'right' }
        
        return null
    }
    
    // Uppdatera animation state och återställ frame vid ändring
    setAnimation(animationName) {
        if (this.currentAnimation !== animationName) {
            this.currentAnimation = animationName
            this.frameIndex = 0
            this.frameTimer = 0
        }
    }
    
    // Hjälpmetod för att ladda sprite med error handling
    loadSprite(animationName, imagePath, frames, frameInterval = null) {
        if (!this.animations) {
            this.animations = {}
        }
        
        const img = new Image()
        img.src = imagePath
        
        img.onload = () => {
            this.spriteLoaded = true
        }
        
        img.onerror = () => {
            console.error(`Failed to load sprite: ${imagePath} for animation: ${animationName}`)
        }
        
        this.animations[animationName] = {
            image: img,
            frames: frames,
            frameInterval: frameInterval
        }
    }
    
    // Uppdatera animation frame (anropa i subklassens update)
    updateAnimation(deltaTime) {
        if (!this.animations || !this.currentAnimation) return
        
        const anim = this.animations[this.currentAnimation]
        if (anim.frames > 1) {
            // Använd animation-specifik frameInterval om den finns, annars default
            const interval = anim.frameInterval || this.frameInterval
            
            this.frameTimer += deltaTime
            if (this.frameTimer >= interval) {
                const wasLastFrame = this.frameIndex === anim.frames - 1
                this.frameIndex = (this.frameIndex + 1) % anim.frames
                this.frameTimer = 0
                
                // Anropa completion callback när animation är klar
                if (wasLastFrame && this.onAnimationComplete) {
                    this.onAnimationComplete(this.currentAnimation)
                }
            }
        }
    }
    
    // Rita sprite (anropa i subklassens draw för att rita sprite)
    drawSprite(ctx, camera = null, flipHorizontal = false) {
        if (!this.spriteLoaded || !this.animations || !this.currentAnimation) return false
        
        const anim = this.animations[this.currentAnimation]
        const frameWidth = anim.image.width / anim.frames
        const frameHeight = anim.image.height
        
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        ctx.save()
        
        if (flipHorizontal) {
            ctx.translate(screenX + this.width, screenY)
            ctx.scale(-1, 1)
            ctx.drawImage(
                anim.image,
                this.frameIndex * frameWidth,
                0,
                frameWidth,
                frameHeight,
                0,
                0,
                this.width,
                this.height
            )
        } else {
            ctx.drawImage(
                anim.image,
                this.frameIndex * frameWidth,
                0,
                frameWidth,
                frameHeight,
                screenX,
                screenY,
                this.width,
                this.height
            )
        }
        
        ctx.restore()
        return true // Returnera true om sprite ritades
    }
}
