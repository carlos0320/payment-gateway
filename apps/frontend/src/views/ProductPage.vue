<!-- src/views/ProductPage.vue -->
<template>
  <section>
    <h1 class="title">Products</h1>

    <div v-if="loading" class="muted">Loading…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="grid">
      <section v-for="p in products" :key="p.productId" class="card">
        <img :src="p.imageUrl" class="img" alt="" />
        <div class="body">
          <div class="row">
            <h2 class="name">{{ p.name }}</h2>
            <div class="price">{{ formatCOP(p.priceInCents) }}</div>
          </div>

          <p class="desc">{{ p.description }}</p>
          <div class="stock" :class="{ out: p.stock === 0 }">
            Stock: {{ p.stock }}
          </div>

          <div class="actions">
            <div class="qty">
              <button class="btn" :disabled="quantitiesByProductId[p.productId] <= 1" @click="decreaseQuantity(p.productId)">-</button>
              <span class="qtyNum">{{ quantitiesByProductId[p.productId] }}</span>
              <button class="btn" :disabled="quantitiesByProductId[p.productId] >= p.stock" @click="increaseQuantity(p.productId, p.stock)">+</button>
            </div>
          </div>
          <button
              class="pay"
              :disabled="p.stock === 0"
              @click="openCheckout(p.productId)"
            >
              Pay with credit card
            </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const products = computed(() => store.state.products.items)
const loading = computed(() => store.state.products.loading)
const error = computed(() => store.state.products.error)


 // map --- productId -> selected quantity
const quantitiesByProductId = reactive({})


//load products and initialize quantity to 1 for each
onMounted(async () => {
  await store.dispatch('products/fetchProducts')
  initializeQuantities()
})

function initializeQuantities() {
  for (const product of store.state.products.items) {
    quantitiesByProductId[product.productId] = 1
  }
}


// increase quantity (cannot exceed available stock)
function increaseQuantity(productId, maxStock) {
  const current = getQuantity(productId)
  quantitiesByProductId[productId] = Math.min(current + 1, maxStock)
}

//decrease quantity (minimum is 1)
function decreaseQuantity(productId) {
  const current = getQuantity(productId)
  quantitiesByProductId[productId] = Math.max(current - 1, 1)
}

// open checkout with selected quantity
function openCheckout(productId) {
  const quantity = getQuantity(productId)

  store.commit('checkout/setQuantity', quantity)
  store.dispatch('checkout/openCheckout', productId)
}

//get quantity (defaults to 1)
function getQuantity(productId) {
  return quantitiesByProductId[productId] ?? 1
}

// format price from cents to COP currency since it comes in cents from back
function formatCOP(cents) {
  const pesos = cents / 100
  return pesos.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
  })
}
</script>

<style scoped>
.title {
    font-size: 20px;
    margin: 0 0 12px;
}

.grid {
  display: grid;
  gap: 16px;

  grid-template-columns: 1fr;
}

.card {
    border: 1px solid #e6e6e6;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
}

.img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    background: #f2f2f2;
}

.body {
    padding: 12px;
}

.row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
}

.name {
    font-size: 16px;
    margin: 0;
    color: #333;
}

.price {
    color: #333;
    font-weight: 700;
}

.desc {
    margin: 8px 0;
    color: #444;
    font-size: 14px;
}

.stock {
    font-size: 13px;
    color: #333;
    margin-bottom: 10px;
}

.stock.out {
    color: #b00020;
}

.actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
}

.qty {
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid #ddd;
    background: #fff;
    color: #777;
}

.qtyNum {
    min-width: 18px;
    text-align: center;
    color:#444
}

.pay {
	width: 100%;
  height: 44px;
  border-radius: 10px;
  border: none;
  background: #111;
  color: #fff;
  margin-top: 10px;
}

.btn,
.pay {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.actions {
	margin: 5px 0 5px 0;
  justify-content: center;
}

.pay:disabled {
    opacity: 0.5;
}

.muted {
    color: #777;
}

.error {
    color: #b00020;
}

/* >= 600px: 2 columns */
@media (min-width: 600px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* >= 900px: 3 columns */
@media (min-width: 900px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* >= 1200px: 4 columns */
@media (min-width: 1200px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}
</style>