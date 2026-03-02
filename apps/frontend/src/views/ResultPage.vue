<!-- src/views/ResultPage.vue -->
<template>
  <div class="backdrop">
    <div class="sheet">
      <h2 class="title">Payment status</h2>

      <div class="box">
        <div class="row"><span>Internal</span><strong>{{ status }}</strong></div>
        <div class="row"><span>Wompi</span><strong>{{ wompi.status }}</strong></div>
      </div>

      <div class="state" v-if="status === 'PROCESSING'">Processing…</div>
      <div class="state ok" v-else-if="status === 'SUCCESS'">✅ Approved</div>
      <div class="state bad" v-else-if="status === 'FAILED'">❌ Failed</div>

      <p class="error" v-if="error">{{ error }}</p>

      <button class="primary" @click="backToProducts" :disabled="status === 'PROCESSING'">
        Back to products
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const status = computed(() => store.state.checkout.status)
const wompi = computed(() => store.state.checkout.wompi)
const error = computed(() => store.state.checkout.error)

async function backToProducts() {
  store.commit('checkout/reset')
  await store.dispatch('products/fetchProducts')
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .35);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 12px;
  z-index: 9999;
}
.sheet {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 18px;
  padding: 14px;
}
.title { margin: 0 0 10px; color: #111; }
.box {
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 10px;
  background: #fafafa;
}
.row { display:flex; justify-content:space-between; margin: 6px 0; }
.state { margin-top: 12px; font-weight: 700; }
.ok { color: #0a7a2f; }
.bad { color: #b00020; }
.error { color: #b00020; margin: 8px 0 0; }
.primary {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: #111;
  color: #fff;
  font-weight: 800;
  margin-top: 12px;
}
.primary:disabled { opacity: .5; }

.box {
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 12px;
  background: #fafafa;
  color: #111;
}

.row span {
  color: #444;
  font-weight: 600;
}

.row strong {
  color: #111;
  font-weight: 800;
  text-transform: uppercase;
}
</style>