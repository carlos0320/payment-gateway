const STORAGE_KEY = 'pg_checkout_v1'

export function persistCheckoutPlugin(store) {
  refreshCheckout(store)
  subscribeToCheckoutChanges(store)
}

function isBlank(value) {
  return value == null || String(value).trim() === ''
}

function isCardMissing(card) {
  return (
    !card ||
    isBlank(card.number) ||
    isBlank(card.cvc) ||
    isBlank(card.expMonth) ||
    isBlank(card.expYear) ||
    isBlank(card.cardHolder)
  )
}

// refresh checkout -> persist on localstorage -> dont include sensible data
function refreshCheckout(store) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    const savedState = JSON.parse(raw)

    store.commit('checkout/refresh', savedState)
    const card = store.state.checkout.card
    const cardMissing = isCardMissing(card)


    // If user is at SUMMARY but card is missing, send them back to FORM to re-enter card.
    if (savedState.step === 'SUMMARY' && cardMissing) {
        store.commit('checkout/setResumeNotice', 'For security reasons, please re-enter your card details.')
        store.commit('checkout/setStep', 'FORM')
    }

    // if payment was in progress, resume polling
    if (
      savedState.transactionId &&
      savedState.status === 'PROCESSING'
    ) {
      store.commit('checkout/setStep', 'RESULT')
      store.dispatch('checkout/pollTransactionStatus')
    }
  } catch (error) {
    // ignore corrupted or invalid localStorage data
  }
}

// persist checkout changes
function subscribeToCheckoutChanges(store) {
  store.subscribe((mutation, state) => {
    // only persist checkout-related mutations
    if (!mutation.type.startsWith('checkout/')) return

    const checkout = state.checkout

    const persistableState = {
      step: checkout.step,
      productId: checkout.productId,
      quantity: checkout.quantity,

      customer: checkout.customer,
      delivery: checkout.delivery,

      contracts: checkout.contracts,
      amounts: checkout.amounts,

      transactionId: checkout.transactionId,
      status: checkout.status,
      wompi: checkout.wompi,
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(persistableState),
    )
  })
}