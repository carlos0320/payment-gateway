import { backendApi } from '../../api/backend'
import { tokenizeCard } from '../../api/wompi'

//checkout steps (UI state machine)
export const CHECKOUT_STEPS = Object.freeze({
  PRODUCT: 'PRODUCT',
  FORM: 'FORM',
  SUMMARY: 'SUMMARY',
  RESULT: 'RESULT',
})


//default state builders
const defaultCustomer = () => ({
  email: '',
  fullName: '',
  phoneNumber: '',
  phonePrefix: '+57',
})

const defaultDelivery = () => ({
  address: '',
  city: '',
  region: '',
  country: 'CO',
})

const defaultContracts = () => ({
  endUserPolicyUrl: '',
  personalDataAuthUrl: '',
  accepted: false,
})

const defaultCard = () => ({
  number: '',
  cvc: '',
  expMonth: '',
  expYear: '',
  cardHolder: '',
})

const defaultContractAccept = () => ({
  policy: false,
  personal: false,
})

const defaultWompi = () => ({
  transactionId: null,
  status: null,
})

// initial state
const defaultState = () => ({
  // ui
  step: CHECKOUT_STEPS.PRODUCT,
  paying: false,
  error: null,

  // product
  productId: null,
  quantity: 1,

  //card
  card: defaultCard(),
  contractAccept: defaultContractAccept(),

  // user input
  customer: defaultCustomer(),
  delivery: defaultDelivery(),

  // transaction
  transactionId: null,
  status: null,
  amounts: null,
  contracts: defaultContracts(),
  wompi: defaultWompi(),
	resumeNotice: null,
	formStep: 'DELIVERY'
})

export default {
  namespaced: true,

  state: defaultState,

  //muttions
  mutations: {
    // ui
    setStep(state, step) {
      state.step = step
    },
    setPaying(state, value) {
      state.paying = value
    },
    setError(state, error) {
      state.error = error
    },

    // product
    setProduct(state, productId) {
      state.productId = productId
    },
    setQuantity(state, quantity) {
      state.quantity = quantity
    },

		setResumeNotice(state, msg) { state.resumeNotice = msg },

    // user input
    setCustomer(state, payload) {
      state.customer = { ...state.customer, ...payload }
    },
    setDelivery(state, payload) {
      state.delivery = { ...state.delivery, ...payload }
    },

    // transaction
    setTransaction(state, { transactionId, status }) {
      state.transactionId = transactionId
      state.status = status
    },
    setAmounts(state, amounts) {
      state.amounts = amounts
    },
    setContracts(state, contracts) {
      state.contracts = { ...state.contracts, ...contracts }
    },
    setWompi(state, wompi) {
      state.wompi = { ...state.wompi, ...wompi }
    },

    setCard(state, payload) { state.card = { ...state.card, ...payload } },
    setContractAccept(state, payload) { state.contractAccept = { ...state.contractAccept, ...payload } },

    setStatus(state, status) { state.status = status },

    reset(state) { // xstate to its initial values.
      Object.assign(state, defaultState())
    },

		setFormStep(state, step) {
			state.formStep = step
		},

		refresh(state, payload) {
			// keep defaults, overlay saved values
			state.step = payload.step ?? state.step
			state.productId = payload.productId ?? state.productId
			state.quantity = payload.quantity ?? state.quantity
			state.customer = payload.customer ?? state.customer
			state.delivery = payload.delivery ?? state.delivery
			state.contracts = payload.contracts ?? state.contracts
			state.amounts = payload.amounts ?? state.amounts
			state.transactionId = payload.transactionId ?? state.transactionId
			state.status = payload.status ?? state.status
			state.wompi = payload.wompi ?? state.wompi
		}
  },


  // actions
  actions: {
    //step 1: user selects a product
    openCheckout({ commit }, productId) {
      commit('setProduct', productId)
      commit('setStep', CHECKOUT_STEPS.FORM)
    },

    // step 2: create transaction on backend
    async initCheckout({ state, commit }) {
      commit('setError', null)

      const payload = {
        productId: state.productId,
        quantity: state.quantity,
        customer: state.customer,
        delivery: state.delivery,
      }

      const { data } = await backendApi.createTransaction(payload)

      commit('setTransaction', {
        transactionId: data.transactionId,
        status: data.status,
      })
      commit('setAmounts', data.amounts)
      commit('setContracts', data.contracts)
    },

    // step 3: pay transaction
    async pay({ state, commit, dispatch }, cardForm) {
      commit('setPaying', true)
      commit('setError', null)

      try {
        const cardToken = await tokenizeCard({
            number: state.card.number.replace(/\s/g, ''),
            cvc: state.card.cvc,
            expMonth: state.card.expMonth,
            expYear: state.card.expYear,
            cardHolder: state.card.cardHolder,
        })

        const { data } = await backendApi.payTransaction(state.transactionId, {
					cardToken,
					installments: 1,
        })

        commit('setStatus', data.status)
        commit('setWompi', data.wompi)
        commit('setStep', CHECKOUT_STEPS.RESULT)

        // poll final status
        dispatch('pollTransactionStatus')
      } catch (err) {
        commit(
          'setError',
          err?.response?.data?.message ??
            err?.message ??
            'Payment failed',
        )
      } finally {
        commit('setPaying', false)
      }
    },

    //Poll transaction status until terminal state
    async pollTransactionStatus({ state, commit }) {
      const MAX_ATTEMPTS = 40
      const DELAY_MS = 2000

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const { data } = await backendApi.getTransaction(state.transactionId)

        commit('setStatus', data.status)
        commit('setWompi', data.wompi)

        if (['SUCCESS', 'FAILED'].includes(data.status)) {
          return
        }

        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    },
  },

  // getters -> state machine
  getters: {
    steps: () => CHECKOUT_STEPS,
  },
}