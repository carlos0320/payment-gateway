import { http } from './http'

export const backendApi = {
  getProducts() {
    return http.get('/products')
  },
  getProduct(id) {
    return http.get(`/products/${id}`)
  },
  createTransaction(payload) {
    return http.post('/transactions', payload)
  },
  payTransaction(transactionId, payload) {
    return http.post(`/transactions/${transactionId}/pay`, payload)
  },
  getTransaction(transactionId) {
    return http.get(`/transactions/${transactionId}`)
  },
}