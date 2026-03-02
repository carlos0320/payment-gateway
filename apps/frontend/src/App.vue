<!-- src/App.vue -->
<template>
  <main class="app">
    <ProductPage />

    <CheckoutModal v-if="step === STEPS.FORM" />
    <SummaryBackdrop v-if="step === STEPS.SUMMARY" />
    <ResultPage v-if="step === STEPS.RESULT" /> 
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

import ProductPage from './views/ProductPage.vue'
import CheckoutModal from './views/CheckoutModal.vue'
import SummaryBackdrop from './views/SummaryBackdrop.vue'
import ResultPage from './views/ResultPage.vue'

const store = useStore()

const STEPS = store.getters['checkout/steps']

const step = computed(() => store.state.checkout.step)
</script>

<style>
.app {
  margin: 0 auto;
  padding: 16px;
}

section {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
  display: block;
  margin: 0;
}

.title {
  text-align: left;
  margin: 0 0 12px;
}

.grid {
  justify-content: start;
  align-content: start;
}
</style>