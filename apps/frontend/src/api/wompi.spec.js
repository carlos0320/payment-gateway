jest.mock('axios', () => ({
  default: { post: jest.fn() },
  post: jest.fn(),
}))

const axios = require('axios')
const { tokenizeCard } = require('./wompi')

beforeEach(() => jest.clearAllMocks())

describe('tokenizeCard', () => {
  it('sends card data to Wompi and returns token id', async () => {
    axios.post.mockResolvedValue({
      data: { data: { id: 'tok_abc123' } },
    })

    const card = {
      number: '4242424242424242',
      cvc: '123',
      expMonth: '08',
      expYear: '28',
      cardHolder: 'John Doe',
    }

    const token = await tokenizeCard(card)

    expect(token).toBe('tok_abc123')
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/tokens/cards'),
      {
        number: '4242424242424242',
        cvc: '123',
        exp_month: '08',
        exp_year: '28',
        card_holder: 'John Doe',
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('returns undefined when response has no token', async () => {
    axios.post.mockResolvedValue({ data: {} })

    const token = await tokenizeCard({ number: '', cvc: '', expMonth: '', expYear: '', cardHolder: '' })

    expect(token).toBeUndefined()
  })
})
