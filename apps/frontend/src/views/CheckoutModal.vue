<!-- src/views/CheckoutModal.vue -->
<template>
  <div class="backdrop" @click.self="closeModal">
    <div class="sheet">
      <div class="grab" />

      <!-- Header always visible -->
      <div class="header">
        <button
					v-if="formStep === 'PAYMENT'"
					class="navBtn"
					@click="goBackToDelivery"
					aria-label="Back"
				>
					←
				</button>

        <h2 class="title">
          {{ formStep === 'DELIVERY' ? 'Delivery details' : 'Pay with credit card' }}
        </h2>

				<button
					class="closeBtn"
					@click="closeModal"
					aria-label="Close"
					:disabled="loading"
				>
					<span aria-hidden="true">✕</span>
				</button>
      </div>

      <p v-if="resumeNotice" class="hint">{{ resumeNotice }}</p>

      <div class="content">
        <!-- STEP A: DELIVERY -->
        <template v-if="formStep === 'DELIVERY'">
          <section class="section">
            <h3 class="h3">Customer</h3>

            <div class="row">
              <label class="label">Email</label>
              <input class="input" placeholder="john@example.com" v-model="customer.email" />
            </div>

            <div class="row">
              <label class="label">Full name</label>
              <input class="input" placeholder="John Doe" v-model="customer.fullName" />
            </div>

            <div class="grid2">
              <div class="row">
                <label class="label">Prefix</label>
                <input class="input" placeholder="+57" v-model="customer.phonePrefix" />
              </div>
              <div class="row">
                <label class="label">Phone</label>
                <input class="input" placeholder="3001112233" v-model="customer.phoneNumber" />
              </div>
            </div>
          </section>

          <section class="section">
            <h3 class="h3">Delivery</h3>

            <div class="row">
              <label class="label">Address</label>
              <input class="input" placeholder="Calle 1 #2-3" v-model="delivery.address" />
            </div>

            <div class="grid2">
              <div class="row">
                <label class="label">City</label>
                <input class="input" placeholder="Bogota" v-model="delivery.city" />
              </div>
              <div class="row">
                <label class="label">Region</label>
                <input class="input" placeholder="Cundinamarca" v-model="delivery.region" />
              </div>
            </div>

            <div class="row">
              <label class="label">Country</label>
              <input class="input" disabled value="CO" />
            </div>
          </section>
        </template>

        <!-- STEP B: PAYMENT -->
        <template v-else>
          <section class="section">
            <h3 class="h3">Card information</h3>

            <div class="row">
              <label class="label">Card number</label>
              <div class="cardRow">
                <input
                  class="input"
                  inputmode="numeric"
                  placeholder="4242 4242 4242 4242"
                  v-model="card.number"
                  @input="formatCardNumber"
                />
                <span class="brand" v-if="cardBrand">{{ cardBrand }}</span>
              </div>
              <p class="hint errorText" v-if="card.number && !isCardNumberValid">
                Invalid card number
              </p>
            </div>

            <div class="grid2">
              <div class="row">
                <label class="label">Exp month</label>
                <input class="input" inputmode="numeric" placeholder="08" v-model="card.expMonth" />
              </div>
              <div class="row">
                <label class="label">Exp year</label>
                <input class="input" inputmode="numeric" placeholder="28" v-model="card.expYear" />
              </div>
            </div>

            <div class="grid2">
              <div class="row">
                <label class="label">CVC</label>
                <input class="input" inputmode="numeric" placeholder="123" v-model="card.cvc" />
              </div>
              <div class="row">
                <label class="label">Card holder</label>
                <input class="input" placeholder="John Smith" v-model="card.cardHolder" />
              </div>
            </div>
          </section>

         <section class="section">
						<h3 class="h3">Contracts</h3>

						<div class="contractsSimple">
							<div class="contractRow">
								

								<label class="contractCheck">
									<input type="checkbox" v-model="accept.policy" :disabled="!contracts.endUserPolicyUrl" />
									<a
									class="contractLink"
									:href="contracts.endUserPolicyUrl || '#'"
									target="_blank"
									rel="noreferrer"
									:class="{ disabled: !contracts.endUserPolicyUrl }"
									:aria-disabled="!contracts.endUserPolicyUrl"
									@click="onEndUserPolicyClick"
								>
									I accept the policy
								</a>
								</label>
							</div>

							<div class="contractRow">
								<label class="contractCheck">
									<input type="checkbox" v-model="accept.personal" :disabled="!contracts.personalDataAuthUrl" />
									<a
									class="contractLink"
									:href="contracts.personalDataAuthUrl || '#'"
									target="_blank"
									rel="noreferrer"
									:class="{ disabled: !contracts.personalDataAuthUrl }"
									:aria-disabled="!contracts.personalDataAuthUrl"
									@click="onPersonalDataAuthUrlClick"
								>
									I accept personal data processing
								</a>
								</label>
							</div>
						</div>
					</section>
        </template>

        <p class="errorMsg" v-if="error">{{ error }}</p>
      </div>

      <!-- Footer button depends on step -->
      <button
        v-if="formStep === 'DELIVERY'"
        class="primary"
        :disabled="loading || !customerDeliveryOk"
        @click="loadCheckout"
      >
        {{ loading ? 'Loading…' : 'Continue' }}
      </button>

      <button
        v-else
        class="primary"
        :disabled="loading || !canContinuePayment"
        @click="goToSummary"
      >
        Continue to summary
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const loading = ref(false)
const error = ref('')

// local copies
const customer = reactive({ ...store.state.checkout.customer })
const delivery = reactive({ ...store.state.checkout.delivery })
const card = reactive({ ...store.state.checkout.card })
const accept = reactive({ ...store.state.checkout.contractAccept })

// store derived
const contracts = computed(() => store.state.checkout.contracts)
const resumeNotice = computed(() => store.state.checkout.resumeNotice)
const formStep = computed(() => store.state.checkout.formStep)

const hasEndUserPolicy = computed(
  () => Boolean(contracts.value.endUserPolicyUrl)
)


const haspersonalDataAuthUrl = computed(
  () => Boolean(contracts.value.personalDataAuthUrl )
)



// keep vuex in sync (no persistence of card in localStorage plugin!)
watch(customer, (v) => store.commit('checkout/setCustomer', v), { deep: true })
watch(delivery, (v) => store.commit('checkout/setDelivery', v), { deep: true })
watch(card, (v) => store.commit('checkout/setCard', v), { deep: true })
watch(accept, (v) => store.commit('checkout/setContractAccept', v), { deep: true })

function closeModal() {
  store.commit('checkout/reset')
}

function onEndUserPolicyClick(event) {
  if (!hasEndUserPolicy.value) {
    event.preventDefault()
  }
}

function onPersonalDataAuthUrlClick(event) {
  if (!haspersonalDataAuthUrl.value) {
    event.preventDefault()
  }
}

function goBackToDelivery() {
  store.commit('checkout/setFormStep', 'DELIVERY')
}

// Step A validation
const customerDeliveryOk = computed(() => {
  return (
    (customer.email || '').includes('@') &&
    (customer.fullName || '').trim().length >= 3 &&
    (customer.phonePrefix || '').startsWith('+') &&
    (customer.phoneNumber || '').trim().length >= 7 &&
    (delivery.address || '').trim().length >= 5 &&
    (delivery.city || '').trim().length >= 2 &&
    (delivery.region || '').trim().length >= 2
  )
})

async function loadCheckout() {
  error.value = ''
  loading.value = true
  try {
    // create internal tx + amounts + contracts
    await store.dispatch('checkout/initCheckout')
    store.commit('checkout/setFormStep', 'PAYMENT')
  } catch (e) {
    error.value = e?.response?.data?.message ?? e?.message ?? 'Failed to start checkout'
  } finally {
    loading.value = false
  }
}

// Card helpers
function onlyDigits(value = '') {
  return value.replace(/\D/g, '')
}

function formatCardNumber() {
  const digits = onlyDigits(card.number).slice(0, 19)
  card.number = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

const cardBrand = computed(() => {
  const d = onlyDigits(card.number)
  if (/^4/.test(d)) return 'VISA'
  if (/^5[1-5]/.test(d) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(d)) return 'MASTERCARD'
  return ''
})

function passesLuhnCheck(number) {
  const digits = number.split('').reverse().map(Number)
  const sum = digits.reduce((acc, digit, index) => {
    if (index % 2 === 1) {
      const doubled = digit * 2
      return acc + (doubled > 9 ? doubled - 9 : doubled)
    }
    return acc + digit
  }, 0)
  return sum % 10 === 0
}

const isCardNumberValid = computed(() => {
  const d = onlyDigits(card.number)
  return d.length >= 13 && passesLuhnCheck(d)
})


// Step B validation (card + contracts)
const canContinuePayment = computed(() => {
  const monthOk = /^\d{2}$/.test(card.expMonth) && +card.expMonth >= 1 && +card.expMonth <= 12
  const yearOk = /^\d{2}$/.test(card.expYear)
  const cvcOk = /^\d{3,4}$/.test(card.cvc)
  const holderOk = (card.cardHolder || '').trim().length >= 3

  const contractsLoaded = !!contracts.value.endUserPolicyUrl && !!contracts.value.personalDataAuthUrl
  const contractsOk = accept.policy && accept.personal

  return (
    isCardNumberValid.value &&
    monthOk &&
    yearOk &&
    cvcOk &&
    holderOk &&
    contractsLoaded &&
    contractsOk
  )
})

function goToSummary() {
  // clear resume message once user proceeds
  store.commit('checkout/setResumeNotice', null)
  store.commit('checkout/setStep', 'SUMMARY')
}
</script>

<style scoped>
.backdrop{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.55);
  display:flex;
  justify-content:center;
  align-items:flex-end;
  padding:12px;
  z-index:9999;
}

.sheet{
  width:100%;
  max-width:420px;
  background:#fff;
  border-radius:18px;
  padding:12px 12px 14px;
  box-shadow:0 -10px 25px rgba(0,0,0,.25);
  animation: up .18s ease-out;
  max-height:92vh;
  display:flex;
  flex-direction:column;
}

@keyframes up{
  from{ transform: translateY(16px); opacity:.8; }
  to{ transform: translateY(0); opacity:1; }
}

.grab{
  width:44px;
  height:5px;
  border-radius:999px;
  background:#d8d8d8;
  margin:6px auto 10px;
}

.header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding: 6px 2px 10px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
  border-bottom: 1px solid #f0f0f0;
}

.title{
  text-align: center;
  font-size:16px;
  margin:0;
  color:#111;
  font-weight:800;
}
.iconBtn{
  border:1px solid #e6e6e6;
  background:#fff;
  width:34px;
  height:34px;
  border-radius:12px;
  cursor:pointer;
  color:#111;
}
.iconBtn:disabled{ opacity: .5; cursor: not-allowed; }

.content{
  overflow:auto;
  padding: 12px 0 10px;
  display:grid;
  gap: 14px;
}

.section{
  border:1px solid #eeeeee;
  border-radius:14px;
  padding:12px;
  background: #fafafa;
}

.h3{
  margin: 0 0 10px;
  font-size: 13px;
  color:#111;
  font-weight:800;
}

.row{ display:grid; gap:6px; }

.label{
  font-size:12px;
  color:#444;
  font-weight:600;
}

.input{
  height:40px;
  border:1px solid #dcdcdc;
  border-radius:12px;
  padding:0 12px;
  outline:none;
  background:#fff;
  color:#111;
}

.input::placeholder{ color:#9a9a9a; }

.input:focus{
  border-color:#111;
  box-shadow: 0 0 0 3px rgba(17,17,17,.08);
}

.input:disabled{
  background:#f2f2f2;
  color:#777;
}

.grid2{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:10px;
}

.cardRow{
  display:flex;
  gap:8px;
  align-items:center;
}

.brand{
  font-size:11px;
  padding: 5px 10px;
  border-radius:999px;
  background:#111;
  color:#fff;
  font-weight:800;
  letter-spacing: .3px;
  white-space: nowrap;
}

.hint{
  margin: 0;
  font-size:12px;
  color:#666;
}
.errorText{ color:#b00020; }

.contracts{
  display:grid;
  gap:10px;
}

.link{
  display:block;
  font-size:13px;
  color:#0b57d0;
  text-decoration:none;
  background:#fff;
  border:1px solid #e6e6e6;
  border-radius:12px;
  padding:10px 12px;
}
.link:hover{ border-color:#cfcfcf; }

.link.disabled{
  opacity: .5;
  pointer-events: none;
}

.closeBtn{
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid #e9e9e9;
  background: #f6f6f6;
  color: #111;
  cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: 18px;
  line-height: 1;

  transition: transform .08s ease, background .15s ease, border-color .15s ease;
}

.contractsSimple{
  display:grid;
  gap: 16px;
}

.contractRow{
  display:grid;
  gap: 10px;
}

.contractLink{
  font-size: 12px;
  font-weight: 400;
  color: #0b57d0;
  text-decoration: none;
}

.contractLink:hover{
  text-decoration: underline;
}

.contractLink.disabled{
  opacity: .5;
  pointer-events: none;
  text-decoration: none;
}

.contractCheck{
  display:flex;
  align-items:flex-start;
  gap: 12px;
  font-size: 15px;
  color:white;
  line-height: 1.35;
}

.contractCheck input{
  width: 16px;
  height: 16px;
  margin-top: 2px;
}

.check{
  font-size:13px;
  display:flex;
  gap:10px;
  align-items:flex-start;
  color:#222;
  background:#fff;
  border:1px solid #e6e6e6;
  border-radius:12px;
  padding:10px 12px;
}

.check input{
  width:18px;
  height:18px;
  margin-top:2px;
}

.primary{
  width:100%;
  height:44px;
  border:none;
  border-radius:14px;
  color:#fff;
  font-weight:800;
  margin-top: 10px;
}

.contractCheck input[type="checkbox"]{
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  width: 18px;
  height: 18px;
  border: 1px solid #cfcfcf;
  border-radius: 4px;
  background: #fff;
  margin-top: 2px;

  display: inline-grid;
  place-content: center;
  cursor: pointer;
}

.contractCheck input[type="checkbox"]:checked{
  background: #111;
  border-color: #111;
}

.contractCheck input[type="checkbox"]:checked::after{
  content: "";
  width: 9px;
  height: 5px;
  border: 2px solid #fff;
  border-top: 0;
  border-right: 0;
  transform: rotate(-45deg);
  margin-top: -1px;
}

.contractCheck input[type="checkbox"]:disabled{
  opacity: .5;
  cursor: not-allowed;
}

.primary:disabled{ opacity:.45; }

.errorMsg{
  color:#b00020;
  font-size:13px;
  margin:0;
}

.hint{
  margin: 6px 0 0;
  font-size: 12px;
  color:#666;
}




.navBtn{
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid #e9e9e9;
  background: #f6f6f6;
  color:#111;
  cursor:pointer;

  display:inline-flex;
  align-items:center;
  justify-content:center;

  transition: transform .08s ease, background .15s ease, border-color .15s ease;
}

.navBtn:hover{ background:#efefef; border-color:#dedede; }
.navBtn:active{ transform: scale(.96); background:#e9e9e9; }
.navBtn:disabled{ opacity:.5; cursor:not-allowed; }

.navIcon{
  width: 20px;
  height: 20px;
  display:block;
}
</style>