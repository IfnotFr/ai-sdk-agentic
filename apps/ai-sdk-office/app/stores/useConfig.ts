import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', {
  state: () => ({
    backendUrl: 'https://api.agentic-office.com',
    backendToken: ''
  }),
  persist: true
})
