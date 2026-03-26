<script setup lang="ts">
import { useConfigStore } from '~/stores/useConfig'
import { useOfficeStore } from '~/stores/useOffice'
import type { OfficeLayout } from '~/types/office'

const configStore = useConfigStore()
const officeStore = useOfficeStore()
const toast = useToast()

const isOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const tabs = [
  { label: 'Général', icon: 'i-lucide-settings', slot: 'general' },
  { label: 'Statistiques', icon: 'i-lucide-chart-bar', slot: 'stats' },
  { label: 'Sauvegarde', icon: 'i-lucide-database', slot: 'backup' }
]

const stats = computed(() => ({
  rooms: officeStore.rooms.length,
  doors: officeStore.doors.length,
  furniture: officeStore.items.length,
  equipment: officeStore.equipments.length,
  zones: officeStore.zones.length,
  total: officeStore.rooms.length + officeStore.doors.length + officeStore.items.length + officeStore.equipments.length + officeStore.zones.length
}))

function downloadJson() {
  const data = {
    app: {
      backend: configStore.backendUrl,
      timestamp: new Date().toISOString()
    },
    stats: stats.value,
    layout: {
      rooms: officeStore.rooms,
      doors: officeStore.doors,
      items: officeStore.items,
      equipments: officeStore.equipments,
      zones: officeStore.zones
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `office-config-${new Date().getTime()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  toast.add({
    title: 'Export réussi',
    description: 'La configuration a été téléchargée.',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}

function triggerUpload() {
  fileInput.value?.click()
}

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  if (!file) return

  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (!data.layout) throw new Error('Format invalide')
      
      const layout = data.layout as OfficeLayout
      
      // Verification of basic structure
      if (!Array.isArray(layout.rooms) || !Array.isArray(layout.items)) {
        throw new Error('Structure de layout manquante')
      }

      // Restoration
      officeStore.clearLayout()
      
      layout.rooms.forEach(r => officeStore.addRoom(r))
      layout.doors.forEach(d => officeStore.addDoor(d))
      layout.items.forEach(i => officeStore.addItem(i))
      layout.equipments.forEach(eq => officeStore.addEquipment(eq))
      layout.zones.forEach(z => officeStore.addZone(z))

      if (data.app?.backend) configStore.backendUrl = data.app.backend

      toast.add({
        title: 'Restauration terminée',
        description: 'Le plan et la configuration ont été mis à jour.',
        color: 'success',
        icon: 'i-lucide-refresh-cw'
      })
      
      isOpen.value = false
    } catch (err) {
      toast.add({
        title: 'Erreur d\'import',
        description: err instanceof Error ? err.message : 'Fichier JSON corrompu ou invalide',
        color: 'error',
        icon: 'i-lucide-triangle-alert'
      })
    } finally {
      input.value = ''
    }
  }
  
  reader.readAsText(file)
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Configuration du Système"
    description="Gérez les paramètres de l'application et exportez vos données."
    size="xl"
  >
    <button class="relative flex flex-col items-center justify-center size-20 transition-all duration-300 active:scale-90 text-dimmed hover:text-highlighted outline-none group">
      <UIcon name="i-lucide-settings" class="size-9" />
      <span class="text-[8px] font-black uppercase tracking-widest mt-1">Config</span>
      
      <!-- Optionnel: petit indicateur visuel de survol comme en bas -->
      <div class="absolute inset-0 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
    </button>

    <template #body>
      <UTabs :items="tabs" class="w-full">
        <!-- Onglet Général -->
        <template #general>
          <div class="space-y-6 py-4">
            <div class="flex items-center gap-2 text-highlighted mb-2">
              <UIcon name="i-lucide-globe" class="size-4 text-primary" />
              <h3 class="text-sm font-bold uppercase tracking-wider">
                Application & Backend
              </h3>
            </div>
            
            <div class="grid gap-4">
              <UFormField label="URL Backend" description="L'adresse de votre API de traitement">
                <UInput v-model="configStore.backendUrl" class="w-full" placeholder="https://api..." />
              </UFormField>

              <UFormField label="Token d'accès" description="Clé de sécurité pour les requêtes">
                <UInput v-model="configStore.backendToken" type="password" class="w-full" placeholder="••••••••••••••••" />
              </UFormField>
            </div>
          </div>
        </template>

        <!-- Onglet Statistiques -->
        <template #stats>
          <div class="space-y-6 py-6 px-2">
            <div class="flex items-center gap-2 text-highlighted mb-4">
              <UIcon name="i-lucide-terminal" class="size-4 text-primary" />
              <h3 class="text-sm font-bold uppercase tracking-wider">
                État du système
              </h3>
            </div>

            <div class="space-y-2 font-mono text-sm text-muted">
              <div class="flex items-center gap-2">
                <span class="text-primary opacity-50">#</span>
                <span>{{ stats.rooms }} pièce{{ stats.rooms > 1 ? 's' : '' }} active{{ stats.rooms > 1 ? 's' : '' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-primary opacity-50">#</span>
                <span>{{ stats.furniture }} mobilier{{ stats.furniture > 1 ? 's' : '' }} posé{{ stats.furniture > 1 ? 's' : '' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-primary opacity-50">#</span>
                <span>{{ stats.doors }} porte{{ stats.doors > 1 ? 's' : '' }} installée{{ stats.doors > 1 ? 's' : '' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-primary opacity-50">#</span>
                <span>{{ stats.zones }} zone{{ stats.zones > 1 ? 's' : '' }} définie{{ stats.zones > 1 ? 's' : '' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-primary opacity-50">#</span>
                <span>{{ stats.equipment }} équipement{{ stats.equipment > 1 ? 's' : '' }} configuré{{ stats.equipment > 1 ? 's' : '' }}</span>
              </div>
            </div>

            <div class="pt-4 border-t border-default text-xs font-mono text-dimmed italic">
              Total : {{ stats.total }} entités synchronisées
            </div>
          </div>
        </template>

        <!-- Onglet Sauvegarde & Restauration -->
        <template #backup>
          <div class="space-y-6 py-4">
            <div class="flex items-center gap-2 text-highlighted mb-4">
              <UIcon name="i-lucide-save" class="size-4 text-primary" />
              <h3 class="text-sm font-bold uppercase tracking-wider">
                Sauvegarde & Restauration
              </h3>
            </div>

            <div class="grid gap-4">
              <!-- Download -->
              <div class="p-5 border border-default rounded-2xl flex items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="size-12 bg-success/10 text-success rounded-xl flex items-center justify-center shrink-0">
                    <UIcon name="i-lucide-download" class="size-6" />
                  </div>
                  <div>
                    <div class="text-sm font-black uppercase tracking-tight text-highlighted">Exporter la config</div>
                    <div class="text-xs text-muted">Télécharger le plan actuel en JSON</div>
                  </div>
                </div>
                <UButton
                  label="Exporter"
                  color="success"
                  variant="subtle"
                  @click="downloadJson"
                />
              </div>

              <!-- Upload -->
              <div class="p-5 border border-default rounded-2xl flex items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <UIcon name="i-lucide-upload" class="size-6" />
                  </div>
                  <div>
                    <div class="text-sm font-black uppercase tracking-tight text-highlighted">Restaurer un plan</div>
                    <div class="text-xs text-muted">Importer un fichier JSON sauvegardé</div>
                  </div>
                </div>
                <UButton
                  label="Importer"
                  color="primary"
                  variant="subtle"
                  @click="triggerUpload"
                />
                <input
                  ref="fileInput"
                  type="file"
                  accept=".json"
                  class="hidden"
                  @change="handleUpload"
                >
              </div>
            </div>

            <UAlert
              icon="i-lucide-info"
              title="Attention"
              description="L'importation d'un nouveau plan remplacera définitivement l'actuel."
              color="neutral"
              variant="subtle"
            />
          </div>
        </template>
      </UTabs>
    </template>

    <template #footer>
      <div class="flex justify-end w-full">
        <UButton
          label="Fermer"
          color="neutral"
          variant="subtle"
          @click="isOpen = false"
        />
      </div>
    </template>
  </UModal>
</template>
