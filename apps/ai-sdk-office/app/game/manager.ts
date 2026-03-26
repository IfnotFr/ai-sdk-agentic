import Phaser from 'phaser'
import { MainScene } from './scenes/MainScene'
import type { OfficeLayout } from '~/types/office'

export function createGame(containerId: string, initialLayout: OfficeLayout) {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: containerId,
    width: '100%',
    height: '100%',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    backgroundColor: '#f9fafb',
    scene: [MainScene],
    callbacks: {
      postBoot: (_game) => {
        console.log('Phaser Game Booted in Fullscreen', initialLayout)
      }
    }
  }

  return new Phaser.Game(config)
}
