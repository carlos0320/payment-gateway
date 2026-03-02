jest.mock('./http', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const { http } = require('./http')
const { backendApi } = require('./backend')

beforeEach(() => jest.clearAllMocks())

describe('backendApi', () => {
  it('getProducts calls GET /products', () => {
    backendApi.getProducts()
    expect(http.get).toHaveBeenCalledWith('/products')
  })

  it('getProduct calls GET /products/:id', () => {
    backendApi.getProduct('prod-1')
    expect(http.get).toHaveBeenCalledWith('/products/prod-1')
  })

  it('createTransaction calls POST /transactions', () => {
    const payload = { productId: 'prod-1', quantity: 2 }
    backendApi.createTransaction(payload)
    expect(http.post).toHaveBeenCalledWith('/transactions', payload)
  })

  it('payTransaction calls POST /transactions/:id/pay', () => {
    const payload = { cardToken: 'tok-1', installments: 1 }
    backendApi.payTransaction('tx-1', payload)
    expect(http.post).toHaveBeenCalledWith('/transactions/tx-1/pay', payload)
  })

  it('getTransaction calls GET /transactions/:id', () => {
    backendApi.getTransaction('tx-1')
    expect(http.get).toHaveBeenCalledWith('/transactions/tx-1')
  })
})
