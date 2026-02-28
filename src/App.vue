<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { isAuthenticated, isTeacher } = useAuth()
const activeTab = ref(route.name as string ?? 'words')

const showTabbar = computed(() =>
  isAuthenticated.value && route.name !== 'login',
)

const themeVars = {
  primaryColor: 'oklch(0.55 0.15 250)',
  buttonPrimaryBackground: 'oklch(0.55 0.15 250)',
  buttonPrimaryBorderColor: 'oklch(0.55 0.15 250)',
  successColor: 'oklch(0.70 0.15 145)',
  dangerColor: 'oklch(0.60 0.20 25)',
  warningColor: 'oklch(0.75 0.12 85)',
  tabbarItemActiveColor: 'oklch(0.55 0.15 250)',
  navBarTitleTextColor: 'oklch(0.25 0.01 260)',
}
</script>

<template><van-config-provider :theme-vars="themeVars">
  <router-view v-slot="{ Component }">
    <transition name="tab-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <van-tabbar v-if="showTabbar" v-model="activeTab" route :placeholder="false" :safe-area-inset-bottom="true" :fixed="true">
    <van-tabbar-item name="words" icon="chat-o" to="/words">
      Words
    </van-tabbar-item>
    <van-tabbar-item name="sentences" icon="records-o" to="/sentences">
      Sentences
    </van-tabbar-item>
    <van-tabbar-item name="phonemes" icon="font-o" to="/phonemes">
      Phonemes
    </van-tabbar-item>
    <van-tabbar-item v-if="isTeacher" name="teacher-words" icon="edit" to="/teacher/words">
      Слова
    </van-tabbar-item>
    <van-tabbar-item v-if="isTeacher" name="teacher-recordings" icon="audio" to="/teacher/recordings">
      Записи
    </van-tabbar-item>
    <van-tabbar-item v-if="!isTeacher" name="achievements" icon="award-o" to="/achievements">
      Progress
    </van-tabbar-item>
    <van-tabbar-item name="account" icon="user-circle-o" to="/account">
      Account
    </van-tabbar-item>
  </van-tabbar>
</van-config-provider>
</template>

<style scoped></style>
