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
        this.frameWidth = 0
        this.frameHeight = 0
    }

    draw(ctx, camera = null) {
        // Gör inget, implementera i subklasser
    }

    // Rita debug-information (hitbox)
    drawDebug(ctx, camera = null) {
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y

        ctx.strokeStyle = 'lime'
        ctx.lineWidth = 2
        ctx.strokeRect(screenX, screenY, this.width, this.height)

        // Rita en punkt i centrum
        ctx.fillStyle = 'red'
        ctx.fillRect(screenX + this.width / 2 - 2, screenY + this.height / 2 - 2, 4, 4)
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

    /**
     * Hjälpmetod för att hantera timers (cooldowns, durations, etc)
     * Används för: shootCooldown, dashTimer, reloadTimer, invulnerableTimer, etc
     * @param {string} timerName - Namnet på timer-variabeln (t.ex. 'shootCooldown')
     * @param {number} deltaTime - Tid sedan senaste frame
     * @returns {boolean} - true om timer är klar (timer <= 0)
     */
    updateTimer(timerName, deltaTime) {
        if (this[timerName] > 0) {
            this[timerName] -= deltaTime
            if (this[timerName] < 0) this[timerName] = 0
            return false
        }
        return true
    }

    /**
     * Starta en timer/cooldown
     */
    startTimer(timerName, duration) {
        this[timerName] = duration
    }

    // Alias för bakåtkompatibilitet
    updateCooldown(timerName, deltaTime) { return this.updateTimer(timerName, deltaTime) }
    startCooldown(timerName, duration) { this.startTimer(timerName, duration) }

    // ===== GEOMETRISKA HJÄLPMETODER =====

    /**
     * Static helper: Kollar om en linje (från p1 till p2) korsar en rektangel
     * Använder line-segment vs rectangle intersection
     * @param {number} x1, y1 - Linjens startpunkt
     * @param {number} x2, y2 - Linjens slutpunkt  
     * @param {Object} rect - Rektangel med {x, y, width, height}
     * @returns {boolean} - true om linjen korsar rektangeln
     */
    static lineIntersectsRect(x1, y1, x2, y2, rect) {
        // Kolla om någon av linjens ändpunkter är inuti rektangeln
        if (x1 >= rect.x && x1 <= rect.x + rect.width &&
            y1 >= rect.y && y1 <= rect.y + rect.height) return true
        if (x2 >= rect.x && x2 <= rect.x + rect.width &&
            y2 >= rect.y && y2 <= rect.y + rect.height) return true

        // Kolla om linjen korsar någon av rektangelns sidor
        // Topp-sida
        if (this.lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.width, rect.y)) return true
        // Botten-sida  
        if (this.lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y + rect.height, rect.x + rect.width, rect.y + rect.height)) return true
        // Vänster-sida
        if (this.lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y, rect.x, rect.y + rect.height)) return true
        // Höger-sida
        if (this.lineIntersectsLine(x1, y1, x2, y2, rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height)) return true

        return false
    }

    /**
     * Static helper: Kollar om två linjesegment korsar varandra
     * Använder line-line intersection (2D)
     */
    static lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Beräkna riktningar
        const denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1))
        if (denom === 0) return false // Parallella linjer

        const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denom
        const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denom

        // Om båda parametrarna är mellan 0 och 1, korsar linjerna
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
    }

    /**
     * Instance method: Kollar om detta objekt har line of sight till ett target
     * @param {GameObject} target - Målobjektet att kolla LOS till
     * @param {Array} obstacles - Array av objekt som blockerar sikt (väggar, block)
     * @returns {boolean} - true om det finns fri sikt
     */
    hasLineOfSight(target, obstacles = []) {
        // Beräkna centrum för båda objekten
        const x1 = this.x + this.width / 2
        const y1 = this.y + this.height / 2
        const x2 = target.x + target.width / 2
        const y2 = target.y + target.height / 2

        // Kolla om linjen mellan objekten korsar något hinder
        for (const obstacle of obstacles) {
            if (GameObject.lineIntersectsRect(x1, y1, x2, y2, obstacle)) {
                return false // Hindret blockerar sikten
            }
        }

        return true // Fri sikt!
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
    loadSprite(animationName, imagePath, options = {}) {
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
 
        const framesX = options.framesX
        const framesY = options.framesY || 1
        const frameInterval = options.frameInterval || null
        const sourceWidth = options.frameWidth || (img.width / framesX)
        const sourceHeight = options.frameHeight || (img.height / framesY)
        const sourceX = options.sourceX || 0
        const sourceY = options.sourceY || 0
        const scale = options.scale || 1

        this.animations[animationName] = {
            image: img,
            framesX: framesX,
            framesY: framesY,
            frameInterval: frameInterval,
            frameWidth: sourceWidth,
            frameHeight: sourceHeight,
            sourceX: sourceX,
            sourceY: sourceY,
            scale: scale
        }
    }

    // Uppdatera animation frame (anropa i subklassens update)
    updateAnimation(deltaTime) {
        if (!this.animations || !this.currentAnimation) return

        const anim = this.animations[this.currentAnimation]
        if (anim.framesX > 1) {
            // Använd animation-specifik frameInterval om den finns, annars default
            const interval = anim.frameInterval || this.frameInterval

            this.frameTimer += deltaTime
            if (this.frameTimer >= interval) {
                const wasLastFrame = this.frameIndex === anim.framesX - 1
                this.frameIndex = (this.frameIndex + 1) % anim.framesX
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
        const frameWidth = anim.frameWidth
        const frameHeight = anim.frameHeight
        const scale = anim.scale || 1

        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        const renderWidth = this.width * scale
        const renderHeight = this.height * scale

        ctx.save()
        if (flipHorizontal) {
            ctx.translate(screenX + renderWidth, screenY)
            ctx.scale(-1, 1)
            ctx.drawImage(
                anim.image,
                anim.sourceX + this.frameIndex * frameWidth,
                anim.sourceY + frameHeight * (anim.framesY - 1),
                frameWidth,
                frameHeight,
                0,
                0,
                renderWidth,
                renderHeight
            )
        } else {
            ctx.drawImage(
                anim.image,
                anim.sourceX + this.frameIndex * frameWidth,
                anim.sourceY + frameHeight * (anim.framesY - 1),
                frameWidth,
                frameHeight,
                screenX,
                screenY,
                renderWidth,
                renderHeight
            )
        }

        ctx.restore()
        return true // Returnera true om sprite ritades
    }
}
