import { backendApi } from '../../api/backend'

export default {
  namespaced: true,
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  mutations: {
    setLoading(state, value) { state.loading = value },
    setError(state, error) { state.error = error },
    setItems(state, items) { state.items = items },
  },
  actions: {
    async fetchProducts({ commit }) {
      commit('setLoading', true)
      commit('setError', null)
      try {
        const { data } = await backendApi.getProducts()
        commit('setItems', data.products)
      } catch (e) {
        commit('setError', e?.message ?? 'Failed to load products')
      } finally {
        commit('setLoading', false)
      }
    },
  },
}