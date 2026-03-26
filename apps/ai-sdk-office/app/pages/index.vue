<template>
  <div class="w-full h-full relative overflow-hidden bg-[--ui-bg] flex items-center justify-center">
    <ClientOnly>
      <GamePhaserCanvas />
      <template #fallback>
        <div class="flex items-center justify-center text-neutral-500 font-medium tracking-widest text-sm uppercase animate-pulse">
          Initialisation du moteur de rendu...
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
