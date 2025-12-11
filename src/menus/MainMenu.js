import Menu from './Menu.js'
import ControlsMenu from './ControlsMenu.js'
import HiScoreMenu from './HiScoreMenu.js'

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
                    this.game.restart()
                }
            },
            {
                text: 'High Scores',
                key: 'h',
                action: () => {
                    this.game.currentMenu = new HiScoreMenu(this.game)
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
