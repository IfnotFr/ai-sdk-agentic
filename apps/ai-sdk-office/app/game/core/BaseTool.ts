import type { MainScene } from '~/game/scenes/MainScene'

export abstract class BaseTool {
  constructor(protected scene: MainScene) {}

  abstract onPointerDown(pointer: Phaser.Input.Pointer): void
  abstract onPointerMove(pointer: Phaser.Input.Pointer): void
  abstract onPointerUp(pointer: Phaser.Input.Pointer): void

  // Appelé quand l'outil est sélectionné
  activate(): void {}
  // Appelé quand l'outil est désélectionné ou le mode change
  deactivate(): void {}

  // Optionnel : gérer la molette
  onWheel(_pointer: Phaser.Input.Pointer, _deltaY: number): void {}

  // Optionnel : gérer la rotation (ex: touche R)
  onRotate(): void {}
}
