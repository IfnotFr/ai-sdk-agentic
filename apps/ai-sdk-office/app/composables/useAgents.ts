import { io, type Socket } from 'socket.io-client'
import type { AgentEvents } from 'ai-sdk-agentic'

/**
 * AgentBusEvent: Wrapped event with timestamp for the UI.
 */
export interface AgentBusEvent<K extends keyof AgentEvents = keyof AgentEvents> {
  event: K
  payload: AgentEvents[K]
  timestamp: number
}

export interface AgentRegistryEntry {
  id: string
  name: string
  tools: string[]
  positions: string[]
}

export interface OfficeRegistry {
  positions: string[]
  agents: AgentRegistryEntry[]
}

export const useAgents = () => {
  const messages = useState<AgentBusEvent[]>('agent-messages', () => [])
  const socket = useState<Socket | null>('agent-socket', () => null)
  const isConnected = useState<boolean>('agent-connected', () => false)
  const registry = useState<OfficeRegistry>('agent-office-registry', () => ({
    positions: [],
    agents: []
  }))

  const connect = () => {
    if (socket.value) return

    const config = useRuntimeConfig()
    const s = io(config.public.agentServerUrl as string)

    s.on('connect', () => {
      isConnected.value = true
      console.log('Connected to Agents Server')
    })

    s.on('disconnect', () => {
      isConnected.value = false
      console.log('Disconnected from Agents Server')
    })

    // Special event for structured registry
    s.on('office.registry', (data: OfficeRegistry) => {
      console.log('Received Office Registry:', data)
      registry.value = data
    })

    // Catch-all for events, strictly typed via AgentEvents
    s.onAny(<K extends keyof AgentEvents>(event: K, payload: AgentEvents[K]) => {
      if ((event as string) === 'office.registry') return // Handled separately
      
      const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      
      // Console styling
      const eventColor = event.startsWith('agent.log') ? '#3b82f6' : '#eab308'
      
      console.groupCollapsed(
        `%c BRIDGE %c ${timeStr} %c ${event.toUpperCase()} `,
        'background: #000; color: #fff; font-weight: bold; border-radius: 3px 0 0 3px;',
        'background: #333; color: #aaa; font-weight: normal;',
        `background: ${eventColor}; color: #000; font-weight: bold; border-radius: 0 3px 3px 0;`
      )
      console.log('Payload:', payload)
      console.groupEnd()

      messages.value.push({ 
        event, 
        payload, 
        timestamp: Date.now() 
      })

      // Bridge to Phaser
      window.dispatchEvent(new CustomEvent('agent-bus', { 
        detail: { event, payload } 
      }))

      // Keep only last 50 messages
      if (messages.value.length > 50) {
        messages.value.shift()
      }
    })

    socket.value = s
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  return {
    messages,
    isConnected,
    registry,
    connect,
    disconnect
  }
}
