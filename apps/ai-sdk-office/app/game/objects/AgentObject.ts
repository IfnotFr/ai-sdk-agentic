import Phaser from 'phaser'
import type { Point } from '~/types/office'
import { GRID_SIZE } from '~/utils/grid'
import type { MainScene } from '~/game/scenes/MainScene'

export class AgentObject extends Phaser.GameObjects.Container {
  private agentVisual: Phaser.GameObjects.Arc
  private badge: Phaser.GameObjects.Container
  private badgeText: Phaser.GameObjects.Text
  private thoughtBubble: Phaser.GameObjects.Container
  private thoughtText: Phaser.GameObjects.Text
  private thoughtBg: Phaser.GameObjects.Rectangle
  
  private moveTween?: Phaser.Tweens.Tween

  constructor(public override scene: MainScene, gx: number, gy: number, public agentId: string) {
    super(scene, gx * GRID_SIZE + GRID_SIZE / 2, gy * GRID_SIZE + GRID_SIZE / 2)
    
    // Corps de l'agent
    this.agentVisual = scene.add.circle(0, 0, 12, 0x3b82f6)
    this.agentVisual.setStrokeStyle(2, 0xffffff)
    
    // Badge de Step (Numéro)
    this.badge = scene.add.container(12, -12)
    const badgeBg = scene.add.circle(0, 0, 10, 0x10b981)
    this.badgeText = scene.add.text(0, 0, '0', { fontSize: '12px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)
    this.badge.add([badgeBg, this.badgeText])
    this.badge.setVisible(false)

    // Bulle de pensée (Positionnée au dessus de la tête)
    this.thoughtBubble = scene.add.container(0, -35)
    this.thoughtBg = scene.add.rectangle(0, 0, 140, 40, 0xffffff, 1).setOrigin(0.5, 1)
    this.thoughtBg.setStrokeStyle(2, 0x3b82f6)
    this.thoughtText = scene.add.text(0, -8, '', { 
      fontSize: '12px', 
      color: '#1f2937', 
      wordWrap: { width: 130 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5, 1)
    
    this.thoughtBubble.add([this.thoughtBg, this.thoughtText])
    this.thoughtBubble.setVisible(false)

    this.add([this.agentVisual, this.badge, this.thoughtBubble])
    
    // S'assurer que tout est visible dans Phaser
    scene.add.existing(this)
    this.setDepth(50)
  }

  setColor(color: number) {
    this.agentVisual.setFillStyle(color)
    this.thoughtBg.setStrokeStyle(2, color)
  }

  updateStep(step: number) {
    this.badgeText.setText(step.toString())
    this.badge.setVisible(true)
    this.scene.tweens.add({
      targets: this.badge,
      y: -18,
      duration: 150,
      yoyo: true
    })
  }

  setThought(text: string) {
    if (!text) {
      this.thoughtBubble.setVisible(false)
      return
    }
    
    this.thoughtText.setText(text)
    this.thoughtBubble.setVisible(true)
    
    // Forcer le recalcul immédiat des bounds pour le background
    const width = Math.max(60, this.thoughtText.width + 20)
    const height = Math.max(30, this.thoughtText.height + 15)
    this.thoughtBg.setSize(width, height)
    
    // Petit effet d'apparition
    this.thoughtBubble.setScale(0.5)
    this.scene.tweens.add({
      targets: this.thoughtBubble,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    })
  }

  async moveAlongPath(path: Point[]) {
    this.stopMovement()
    for (const point of path) {
      await this.executeMove(point.gx * GRID_SIZE + GRID_SIZE / 2, point.gy * GRID_SIZE + GRID_SIZE / 2)
    }
  }

  private executeMove(x: number, y: number): Promise<void> {
    return new Promise((resolve) => {
      this.moveTween = this.scene.tweens.add({
        targets: this,
        x, y,
        duration: 80, // Accéléré : 80ms par case
        onComplete: () => resolve()
      })
    })
  }

  stopMovement() {
    if (this.moveTween) {
      this.moveTween.stop()
      this.moveTween = undefined
    }
  }

  get gridPos(): Point {
    return {
      gx: Math.floor(this.x / GRID_SIZE),
      gy: Math.floor(this.y / GRID_SIZE)
    }
  }
}
