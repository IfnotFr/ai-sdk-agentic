export class SpeechBuffer {
  private fullText = ''
  private isProcessing = false
  private isDestroyed = false
  private callback: (text: string) => void
  private currentTimeout?: any

  constructor(callback: (text: string) => void) {
    this.callback = callback
  }

  append(text: string) {
    if (this.isDestroyed) return
    this.fullText += text
    if (!this.isProcessing) {
      this.process()
    }
  }

  private async process() {
    if (this.isDestroyed) return
    this.isProcessing = true

    while (this.fullText.length > 0 && !this.isDestroyed) {
      const phraseMatch = /[.!?;:\n]/.exec(this.fullText)
      let phrase = ''
      
      if (phraseMatch) {
        const index = phraseMatch.index + 1
        phrase = this.fullText.substring(0, index).trim()
        this.fullText = this.fullText.substring(index)
      } else if (this.fullText.length > 30) {
        const lastSpace = this.fullText.lastIndexOf(' ', 40)
        const index = lastSpace > 10 ? lastSpace : 40
        phrase = this.fullText.substring(0, index).trim()
        this.fullText = this.fullText.substring(index)
      } else {
        break
      }

      if (phrase && !this.isDestroyed) {
        this.callback(phrase)
        const delay = Math.max(1500, phrase.length * 50)
        await new Promise(resolve => {
          this.currentTimeout = setTimeout(resolve, delay)
        })
      }
    }

    if (this.fullText.length === 0 && !this.isDestroyed) {
      await new Promise(resolve => {
        this.currentTimeout = setTimeout(resolve, 1000)
      })
      if (!this.isDestroyed) this.callback('')
    }

    this.isProcessing = false
  }

  destroy() {
    this.isDestroyed = true
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout)
    }
  }
}

export class ActionQueue {
  private queue: (() => Promise<void>)[] = []
  private isRunning = false
  private isDestroyed = false

  async add(action: () => Promise<void>) {
    if (this.isDestroyed) return
    this.queue.push(action)
    this.run()
  }

  private async run() {
    if (this.isRunning || this.queue.length === 0 || this.isDestroyed) return
    this.isRunning = true

    while (this.queue.length > 0 && !this.isDestroyed) {
      const action = this.queue.shift()
      if (action) await action()
    }

    this.isRunning = false
  }

  destroy() {
    this.isDestroyed = true
    this.queue = []
  }
}
