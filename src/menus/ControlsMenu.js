import Menu from './Menu.js'
import MainMenu from './MainMenu.js'

export default class ControlsMenu extends Menu {
    getTitle() {
        return 'Controls'
    }
    
    getOptions() {
        return [
            {
                text: 'Arrow Keys - Move',
                key: null,
                action: null
            },
            {
                text: 'Space - Jump',
                key: null,
                action: null
            },
            {
                text: 'X - Shoot',
                key: null,
                action: null
            },
            {
                text: 'Back to Menu',
                key: 'Escape',
                action: () => {
                    this.game.gameState = 'MENU'
                    this.game.currentMenu = new MainMenu(this.game)
                }
            }
        ]
    }
}
