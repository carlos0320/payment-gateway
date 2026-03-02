import checkout, { CHECKOUT_STEPS } from './checkout'

jest.mock('../../api/backend', () => ({
  backendApi: {
    createTransaction: jest.fn(),
    payTransaction: jest.fn(),
    getTransaction: jest.fn(),
  },
}))
jest.mock('../../api/wompi', () => ({
  tokenizeCard: jest.fn(),
}))

const { backendApi } = require('../../api/backend')
const { tokenizeCard } = require('../../api/wompi')

const { mutations, actions, getters } = checkout

function freshState() {
  return checkout.state()
}

describe('checkout mutations', () => {
  it('setStep changes step', () => {
    const state = freshState()
    mutations.setStep(state, 'FORM')
    expect(state.step).toBe('FORM')
  })

  it('setPaying changes paying flag', () => {
    const state = freshState()
    mutations.setPaying(state, true)
    expect(state.paying).toBe(true)
  })

  it('setError changes error', () => {
    const state = freshState()
    mutations.setError(state, 'something failed')
    expect(state.error).toBe('something failed')
  })

  it('setProduct sets productId', () => {
    const state = freshState()
    mutations.setProduct(state, 'prod-1')
    expect(state.productId).toBe('prod-1')
  })

  it('setQuantity sets quantity', () => {
    const state = freshState()
    mutations.setQuantity(state, 5)
    expect(state.quantity).toBe(5)
  })

  it('setCustomer merges customer fields', () => {
    const state = freshState()
    mutations.setCustomer(state, { email: 'a@b.com' })
    expect(state.customer.email).toBe('a@b.com')
    expect(state.customer.phonePrefix).toBe('+57') // default preserved
  })

  it('setDelivery merges delivery fields', () => {
    const state = freshState()
    mutations.setDelivery(state, { city: 'Cali' })
    expect(state.delivery.city).toBe('Cali')
    expect(state.delivery.country).toBe('CO') // default preserved
  })

  it('setTransaction sets transactionId and status', () => {
    const state = freshState()
    mutations.setTransaction(state, { transactionId: 'tx-1', status: 'PENDING' })
    expect(state.transactionId).toBe('tx-1')
    expect(state.status).toBe('PENDING')
  })

  it('setAmounts sets amounts', () => {
    const state = freshState()
    const amounts = { totalInCents: 100000 }
    mutations.setAmounts(state, amounts)
    expect(state.amounts).toEqual(amounts)
  })

  it('setContracts merges contracts', () => {
    const state = freshState()
    mutations.setContracts(state, { endUserPolicyUrl: 'https://example.com' })
    expect(state.contracts.endUserPolicyUrl).toBe('https://example.com')
  })

  it('setWompi merges wompi data', () => {
    const state = freshState()
    mutations.setWompi(state, { transactionId: 'wompi-1', status: 'APPROVED' })
    expect(state.wompi.transactionId).toBe('wompi-1')
    expect(state.wompi.status).toBe('APPROVED')
  })

  it('setCard merges card fields', () => {
    const state = freshState()
    mutations.setCard(state, { number: '4242' })
    expect(state.card.number).toBe('4242')
    expect(state.card.cvc).toBe('') // default preserved
  })

  it('setContractAccept merges acceptance', () => {
    const state = freshState()
    mutations.setContractAccept(state, { policy: true })
    expect(state.contractAccept.policy).toBe(true)
    expect(state.contractAccept.personal).toBe(false)
  })

  it('setStatus sets status', () => {
    const state = freshState()
    mutations.setStatus(state, 'SUCCESS')
    expect(state.status).toBe('SUCCESS')
  })

  it('setResumeNotice sets notice', () => {
    const state = freshState()
    mutations.setResumeNotice(state, 'Please re-enter card')
    expect(state.resumeNotice).toBe('Please re-enter card')
  })

  it('setFormStep sets formStep', () => {
    const state = freshState()
    mutations.setFormStep(state, 'PAYMENT')
    expect(state.formStep).toBe('PAYMENT')
  })

  it('reset restores initial state', () => {
    const state = freshState()
    state.step = 'RESULT'
    state.productId = 'prod-99'
    state.paying = true
    mutations.reset(state)
    expect(state.step).toBe('PRODUCT')
    expect(state.productId).toBeNull()
    expect(state.paying).toBe(false)
  })

  it('refresh overlays saved values on current state', () => {
    const state = freshState()
    mutations.refresh(state, {
      step: 'SUMMARY',
      productId: 'prod-2',
      quantity: 3,
    })
    expect(state.step).toBe('SUMMARY')
    expect(state.productId).toBe('prod-2')
    expect(state.quantity).toBe(3)
    // unset fields keep defaults
    expect(state.customer.phonePrefix).toBe('+57')
  })
})

// ─── ACTIONS ───

describe('checkout actions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('openCheckout sets product and moves to FORM', () => {
    const commit = jest.fn()
    actions.openCheckout({ commit }, 'prod-1')
    expect(commit).toHaveBeenCalledWith('setProduct', 'prod-1')
    expect(commit).toHaveBeenCalledWith('setStep', CHECKOUT_STEPS.FORM)
  })

  it('initCheckout creates transaction and stores response', async () => {
    const state = { productId: 'prod-1', quantity: 2, customer: {}, delivery: {} }
    const commit = jest.fn()

    backendApi.createTransaction.mockResolvedValue({
      data: {
        transactionId: 'tx-1',
        status: 'PENDING',
        amounts: { totalInCents: 207500 },
        contracts: { endUserPolicyUrl: 'https://u.co' },
      },
    })

    await actions.initCheckout({ state, commit })

    expect(backendApi.createTransaction).toHaveBeenCalledWith({
      productId: 'prod-1',
      quantity: 2,
      customer: {},
      delivery: {},
    })
    expect(commit).toHaveBeenCalledWith('setTransaction', { transactionId: 'tx-1', status: 'PENDING' })
    expect(commit).toHaveBeenCalledWith('setAmounts', { totalInCents: 207500 })
    expect(commit).toHaveBeenCalledWith('setContracts', { endUserPolicyUrl: 'https://u.co' })
  })

  it('pay tokenizes card, submits payment, and moves to RESULT', async () => {
    const state = {
      card: { number: '4242 4242 4242 4242', cvc: '123', expMonth: '08', expYear: '28', cardHolder: 'John' },
      transactionId: 'tx-1',
    }
    const commit = jest.fn()
    const dispatch = jest.fn()

    tokenizeCard.mockResolvedValue('card-tok-abc')
    backendApi.payTransaction.mockResolvedValue({
      data: { status: 'PROCESSING', wompi: { transactionId: 'w-1', status: 'PENDING' } },
    })

    await actions.pay({ state, commit, dispatch })

    expect(tokenizeCard).toHaveBeenCalledWith({
      number: '4242424242424242', // spaces stripped
      cvc: '123',
      expMonth: '08',
      expYear: '28',
      cardHolder: 'John',
    })
    expect(backendApi.payTransaction).toHaveBeenCalledWith('tx-1', {
      cardToken: 'card-tok-abc',
      installments: 1,
    })
    expect(commit).toHaveBeenCalledWith('setStatus', 'PROCESSING')
    expect(commit).toHaveBeenCalledWith('setStep', CHECKOUT_STEPS.RESULT)
    expect(dispatch).toHaveBeenCalledWith('pollTransactionStatus')
    expect(commit).toHaveBeenCalledWith('setPaying', false) // finally block
  })

  it('pay sets error on failure', async () => {
    const state = { card: { number: '', cvc: '', expMonth: '', expYear: '', cardHolder: '' }, transactionId: 'tx-1' }
    const commit = jest.fn()
    const dispatch = jest.fn()

    tokenizeCard.mockRejectedValue(new Error('Card declined'))

    await actions.pay({ state, commit, dispatch })

    expect(commit).toHaveBeenCalledWith('setError', 'Card declined')
    expect(commit).toHaveBeenCalledWith('setPaying', false)
  })

  it('pollTransactionStatus polls until SUCCESS', async () => {
    const state = { transactionId: 'tx-1' }
    const commit = jest.fn()

    backendApi.getTransaction
      .mockResolvedValueOnce({ data: { status: 'PROCESSING', wompi: {} } })
      .mockResolvedValueOnce({ data: { status: 'SUCCESS', wompi: { status: 'APPROVED' } } })

    // Speed up setTimeout
    jest.useFakeTimers()
    const promise = actions.pollTransactionStatus({ state, commit })
    await jest.advanceTimersByTimeAsync(2000)
    await promise
    jest.useRealTimers()

    expect(backendApi.getTransaction).toHaveBeenCalledTimes(2)
    expect(commit).toHaveBeenCalledWith('setStatus', 'SUCCESS')
  })

  it('pollTransactionStatus stops on FAILED', async () => {
    const state = { transactionId: 'tx-1' }
    const commit = jest.fn()

    backendApi.getTransaction.mockResolvedValue({
      data: { status: 'FAILED', wompi: { status: 'DECLINED' } },
    })

    await actions.pollTransactionStatus({ state, commit })

    expect(backendApi.getTransaction).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('setStatus', 'FAILED')
  })
})
// test de getters
describe('checkout getters', () => {
  it('steps returns CHECKOUT_STEPS', () => {
    expect(getters.steps()).toBe(CHECKOUT_STEPS)
  })
})
