<template>
  <div class="backdrop" @click.self="!loading && close()">
    <div class="sheet">
      <div class="grab"/>

      <div class="header">
        <h2 class="title">Summary</h2>
        <button class="x"
            @click="back" aria-label="Back"
            :disabled="paying || status==='PROCESSING'" 
        >
            ←
        </button>
      </div>

      <div class="content" v-if="amounts">
        <div class="line">
          <span>Product amount</span>
          <strong>{{ formatCOP(amounts.productAmountInCents) }}</strong>
        </div>
        <div class="line">
          <span>Base fee</span>
          <strong>{{ formatCOP(amounts.baseFeeInCents) }}</strong>
        </div>
        <div class="line">
          <span>Delivery fee</span>
          <strong>{{ formatCOP(amounts.deliveryFeeInCents) }}</strong>
        </div>

        <div class="divider"></div>

        <div class="line total">
          <span>Total</span>
          <strong>{{ formatCOP(amounts.totalInCents) }}</strong>
        </div>

        <p class="error" v-if="error">{{ error }}</p>
      </div>

      <button class="primary" :disabled="paying || !amounts" @click="payNow">
        {{ paying ? 'Processing…' : 'Pay' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const amounts = computed(() => store.state.checkout.amounts)
const paying = computed(() => store.state.checkout.paying)
const error = ref('')

function formatCOP(cents) {
  const pesos = cents / 100
  return pesos.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
}

function back() {
  store.commit('checkout/setStep', 'FORM')
}

async function payNow() {
  error.value = ''
  try {
    await store.dispatch('checkout/pay')
  } catch (e) {
    error.value = e?.message ?? 'Payment failed'
  }
}
</script>

<style scoped>
.backdrop{
  position:fixed; inset:0;
  background: rgba(0,0,0,.25);
  display:flex;
  justify-content:center;
  align-items:flex-end;
  padding:12px;
  z-index: 9998;
}

.sheet{
  width:100%;
  max-width:420px;
  background:#fff;
  border-radius:18px;
  padding:12px 12px 14px;
  box-shadow:0 -10px 25px rgba(0,0,0,.18);
  animation: up .18s ease-out;
}

@keyframes up{
  from{ transform: translateY(16px); opacity:.8; }
  to{ transform: translateY(0); opacity:1; }
}

.grab{
  width:44px; height:5px;
  border-radius:999px;
  background:#d8d8d8;
  margin:6px auto 10px;
}

.header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  margin-bottom: 10px;
}

.title{
  margin:0;
  font-size:16px;
  font-weight:800;
  color:#111;
}

.x{
  border:1px solid #e6e6e6;
  background:#fff;
  width:34px;
  height:34px;
  border-radius:12px;
  cursor:pointer;
}

.content{
  display:grid;
  gap:10px;
  padding: 6px 0 12px;
}

.line{
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:14px;
  color:#222;
}

.divider{
  height:1px;
  background:#f0f0f0;
  margin: 4px 0;
}

.total{
  font-size:15px;
}

.primary{
  width:100%;
  height:44px;
  border:none;
  border-radius:14px;
  background:#111;
  color:#fff;
  font-weight:800;
}

.primary:disabled{ opacity:.55; }

.error{ color:#b00020; font-size:13px; margin:0; }
</style>