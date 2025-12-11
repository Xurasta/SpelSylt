import Menu from './Menu.js'
import ControlsMenu from './ControlsMenu.js'

export default class MainMenu extends Menu {
    getTitle() {
        return 'Game Menu'
    }
    
    getOptions() {
        return [
            {
                text: 'Start Game',
                key: ' ',
                action: () => {
                    this.game.gameState = 'PLAYING'
                    this.game.currentMenu = null
                    this.game.inputHandler.keys.clear()
                }
            },
            {
                text: 'Controls',
                key: 'c',
                action: () => {
                    this.game.currentMenu = new ControlsMenu(this.game)
                }
            }
        ]
    }
}
