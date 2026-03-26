import type { MainScene } from '~/game/scenes/MainScene'
import { AgentObject } from '~/game/objects/AgentObject'
import { SpeechBuffer } from './AgentUtilities'
import { Pathfinder } from './Pathfinder'
import type { Point } from '~/types/office'
import type { AgenticMission } from 'ai-sdk-agentic'

export class AgentManager {
  private agents: Map<string, { 
    obj: AgentObject, 
    buffer: SpeechBuffer 
  }> = new Map()

  constructor(private scene: MainScene) {}

  handleStart(mission: AgenticMission) {
    const officeMetadata = mission.agent.metadata?.office as any
    const agentId = officeMetadata?.id || mission.agent.id
    
    if (this.agents.has(agentId)) {
      const agent = this.agents.get(agentId)!
      if (!agent.obj.active) {
         this.spawnAgent(agentId, mission)
      } else {
        // If already active, move to thinking or idle or fallback
        this.goToInitialPosition(agentId, mission)
      }
      return
    }
    
    this.spawnAgent(agentId, mission)
  }

  private async spawnAgent(agentId: string, mission: AgenticMission) {
    const spawnZones = this.findAllZonesByType('entry_exit')
    const spawnPoint = spawnZones.length > 0 
      ? spawnZones[Math.floor(Math.random() * spawnZones.length)]
      : { gx: 1, gy: 1 }
    
    if (!spawnPoint) return

    const agentObj = new AgentObject(this.scene, spawnPoint.gx, spawnPoint.gy, agentId)
    
    // Apply log metadata
    const logMetadata = mission.agent.metadata?.log as { name?: string, color?: string } | undefined
    if (logMetadata?.color) {
      const color = logMetadata.color.startsWith('#') 
        ? parseInt(logMetadata.color.slice(1), 16) 
        : 0x3b82f6
      agentObj.setColor(color)
    }

    const buffer = new SpeechBuffer((text) => {
      if (agentObj.active) agentObj.setThought(text)
    })

    this.agents.set(agentId, { obj: agentObj, buffer })

    // Move to initial position after spawning
    await this.goToInitialPosition(agentId, mission)
  }

  private async goToInitialPosition(agentId: string, mission: AgenticMission) {
    const agent = this.agents.get(agentId)
    if (!agent || !agent.obj.active) return

    const officeMetadata = mission.agent.metadata?.office as any
    const target = officeMetadata?.thinkingPosition || officeMetadata?.idlePosition
    
    const targetZone = this.findZoneByTarget(target)
    if (targetZone) {
      await this.moveAgentTo(agent.obj, { gx: targetZone.gx, gy: targetZone.gy })
    }
  }

  handleStepStart(agentId: string, stepNumber: number) {
    const agent = this.agents.get(agentId)
    if (agent && agent.obj.active) agent.obj.updateStep(stepNumber)
  }

  async handleToolStart(agentId: string, toolName: string) {
    const agent = this.agents.get(agentId)
    if (!agent || !agent.obj.active) return

    const targetZone = this.findZoneByTarget(toolName)
    if (targetZone) {
      await this.moveAgentTo(agent.obj, { gx: targetZone.gx, gy: targetZone.gy })
    }
  }

  async handleToolFinish(agentId: string, mission: AgenticMission) {
    const agent = this.agents.get(agentId)
    if (!agent || !agent.obj.active) return

    const officeMetadata = mission.agent.metadata?.office as any
    const thinkingPosition = officeMetadata?.thinkingPosition

    if (thinkingPosition) {
      const targetZone = this.findZoneByTarget(thinkingPosition)
      if (targetZone) {
        await this.moveAgentTo(agent.obj, { gx: targetZone.gx, gy: targetZone.gy })
      }
    }
    // Else: Stay at the tool zone (do nothing)
  }

  handleText(agentId: string, text: string) {
    const agent = this.agents.get(agentId)
    if (agent) agent.buffer.append(text)
  }

  async handleFinish(agentId: string, mission: AgenticMission) {
    const agent = this.agents.get(agentId)
    if (!agent || !agent.obj.active) return

    const officeMetadata = mission.agent.metadata?.office as any
    const idlePosition = officeMetadata?.idlePosition

    if (!idlePosition) {
      // Leave the scene: Go to entry_exit and disappear
      const spawnZones = this.findAllZonesByType('entry_exit')
      const target: Point = spawnZones[Math.floor(Math.random() * spawnZones.length)] || { gx: 1, gy: 1 }
      
      await this.moveAgentTo(agent.obj, target)
      
      if (agent.obj.active) {
        this.removeAgent(agentId)
      }
    } else {
      // Go back to idle position
      const targetZone = this.findZoneByTarget(idlePosition)
      if (targetZone) {
        await this.moveAgentTo(agent.obj, { gx: targetZone.gx, gy: targetZone.gy })
      }
    }
  }

  /**
   * findZoneByTarget: Search for a zone with a specific target, or fallback to an untargeted zone.
   */
  private findZoneByTarget(targetName?: string | null): (Point & { registryId: string, properties?: any }) | null {
    const layout = this.scene.getLayout()
    
    // 1. Try to find a specific zone for this target
    if (targetName) {
      const pattern = new RegExp(targetName, 'i')
      const specificZone = layout.zones.find(z => 
        z.registryId === 'zone' && 
        z.properties?.targets && 
        z.properties.targets.some(t => pattern.test(t))
      )
      if (specificZone) return specificZone as any
    }

    // 2. Fallback to any zone without any targets defined
    const fallbackZone = layout.zones.find(z => 
      z.registryId === 'zone' && 
      (!z.properties?.targets || z.properties.targets.length === 0)
    )
    return (fallbackZone as any) || null
  }

  private findAllZonesByType(type: 'entry_exit' | 'zone'): Point[] {
    const layout = this.scene.getLayout()
    return layout.zones
      .filter(z => z.registryId === type)
      .map(z => ({ gx: z.gx, gy: z.gy }))
  }

  private async moveAgentTo(agent: AgentObject, target: Point) {
    if (!agent.active) return
    agent.stopMovement()
    
    const pathfinder = new Pathfinder(this.scene.getLayout())
    const path = pathfinder.findPath(agent.gridPos, target)
    if (path && agent.active) {
      await agent.moveAlongPath(path)
    }
  }

  private removeAgent(agentId: string) {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.buffer.destroy()
      agent.obj.destroy()
      this.agents.delete(agentId)
    }
  }

  destroy() {
    this.agents.forEach((_, id) => this.removeAgent(id))
    this.agents.clear()
  }
}
