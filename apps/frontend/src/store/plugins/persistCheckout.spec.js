import { persistCheckoutPlugin } from './persistCheckout'

const STORAGE_KEY = 'pg_checkout_v1'

function makeStore(checkoutState = {}) {
  const subscribers = []
  return {
    state: {
      checkout: {
        card: { number: '', cvc: '', expMonth: '', expYear: '', cardHolder: '' },
        step: 'PRODUCT',
        productId: null,
        quantity: 1,
        customer: {},
        delivery: {},
        contracts: {},
        amounts: null,
        transactionId: null,
        status: null,
        wompi: {},
        ...checkoutState,
      },
    },
    commit: jest.fn(),
    dispatch: jest.fn(),
    subscribe(fn) {
      subscribers.push(fn)
    },
    // helper to trigger subscribers in tests
    _triggerMutation(type) {
      subscribers.forEach((fn) => fn({ type }, this.state))
    },
  }
}

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
})

describe('persistCheckoutPlugin', () => {
  it('does nothing when localStorage is empty', () => {
    const store = makeStore()
    persistCheckoutPlugin(store)
    expect(store.commit).not.toHaveBeenCalledWith('checkout/refresh', expect.anything())
  })

  it('restores saved state from localStorage', () => {
    const saved = { step: 'FORM', productId: 'prod-1', quantity: 2 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    const store = makeStore()
    persistCheckoutPlugin(store)

    expect(store.commit).toHaveBeenCalledWith('checkout/refresh', saved)
  })

  it('redirects to FORM when at SUMMARY but card is missing', () => {
    const saved = { step: 'SUMMARY', productId: 'prod-1' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    const store = makeStore() // card fields are blank by default
    persistCheckoutPlugin(store)

    expect(store.commit).toHaveBeenCalledWith(
      'checkout/setResumeNotice',
      'For security reasons, please re-enter your card details.',
    )
    expect(store.commit).toHaveBeenCalledWith('checkout/setStep', 'FORM')
  })

  it('resumes polling when status is PROCESSING', () => {
    const saved = { step: 'RESULT', transactionId: 'tx-1', status: 'PROCESSING' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    const store = makeStore()
    persistCheckoutPlugin(store)

    expect(store.commit).toHaveBeenCalledWith('checkout/setStep', 'RESULT')
    expect(store.dispatch).toHaveBeenCalledWith('checkout/pollTransactionStatus')
  })

  it('does NOT resume polling when status is SUCCESS', () => {
    const saved = { transactionId: 'tx-1', status: 'SUCCESS' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    const store = makeStore()
    persistCheckoutPlugin(store)

    expect(store.dispatch).not.toHaveBeenCalledWith('checkout/pollTransactionStatus')
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json!!!')

    const store = makeStore()
    // should not throw
    expect(() => persistCheckoutPlugin(store)).not.toThrow()
  })

  it('persists checkout state on checkout mutations', () => {
    const store = makeStore({
      step: 'FORM',
      productId: 'prod-1',
      quantity: 2,
      customer: { email: 'a@b.com' },
      delivery: { city: 'Bogota' },
      contracts: {},
      amounts: { totalInCents: 100000 },
      transactionId: 'tx-1',
      status: 'PENDING',
      wompi: { transactionId: null },
    })

    persistCheckoutPlugin(store)
    store._triggerMutation('checkout/setStep')

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(persisted.step).toBe('FORM')
    expect(persisted.productId).toBe('prod-1')
    expect(persisted.transactionId).toBe('tx-1')
    // card should NOT be persisted
    expect(persisted.card).toBeUndefined()
  })

  it('ignores non-checkout mutations', () => {
    const store = makeStore()
    persistCheckoutPlugin(store)

    store._triggerMutation('products/setItems')

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
