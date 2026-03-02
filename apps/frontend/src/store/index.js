import { createStore } from 'vuex'
import products from './modules/products'
import checkout from './modules/checkout'
import { persistCheckoutPlugin } from './plugins/persistCheckout'

export default createStore({
  modules: { products, checkout },
  plugins: [persistCheckoutPlugin],
})