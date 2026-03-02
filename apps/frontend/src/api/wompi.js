import axios from 'axios'

const WOMPI_BASE_URL = import.meta.env.VITE_WOMPI_URL
const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY

export async function tokenizeCard(card) {
  const res = await axios.post(
    `${WOMPI_BASE_URL}/tokens/cards`,
    {
      number: card.number,
      cvc: card.cvc,
      exp_month: card.expMonth,
      exp_year: card.expYear,
      card_holder: card.cardHolder,
    },
    {
      headers: {
        Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )
  return res.data?.data?.id 
}