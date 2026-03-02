import products from './products'

jest.mock('../../api/backend', () => ({
  backendApi: {
    getProducts: jest.fn(),
  },
}))

const { backendApi } = require('../../api/backend')

const { mutations, actions } = products

function freshState() {
  return products.state()
}

describe('products mutations', () => {
  it('setLoading sets loading flag', () => {
    const state = freshState()
    mutations.setLoading(state, true)
    expect(state.loading).toBe(true)
  })

  it('setError sets error message', () => {
    const state = freshState()
    mutations.setError(state, 'Network error')
    expect(state.error).toBe('Network error')
  })

  it('setItems sets product list', () => {
    const state = freshState()
    const items = [{ productId: 'p-1' }, { productId: 'p-2' }]
    mutations.setItems(state, items)
    expect(state.items).toEqual(items)
  })
})

describe('products actions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('fetchProducts loads items on success', async () => {
    const commit = jest.fn()
    backendApi.getProducts.mockResolvedValue({
      data: { products: [{ productId: 'p-1' }] },
    })

    await actions.fetchProducts({ commit })

    expect(commit).toHaveBeenCalledWith('setLoading', true)
    expect(commit).toHaveBeenCalledWith('setItems', [{ productId: 'p-1' }])
    expect(commit).toHaveBeenCalledWith('setLoading', false)
    expect(commit).not.toHaveBeenCalledWith('setError', expect.any(String))
  })

  it('fetchProducts sets error on failure', async () => {
    const commit = jest.fn()
    backendApi.getProducts.mockRejectedValue(new Error('timeout'))

    await actions.fetchProducts({ commit })

    expect(commit).toHaveBeenCalledWith('setError', 'timeout')
    expect(commit).toHaveBeenCalledWith('setLoading', false)
  })

  it('fetchProducts uses fallback message when error has no message', async () => {
    const commit = jest.fn()
    backendApi.getProducts.mockRejectedValue({})

    await actions.fetchProducts({ commit })

    expect(commit).toHaveBeenCalledWith('setError', 'Failed to load products')
  })
})
