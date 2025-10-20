import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  Instruction,
  isSolanaError,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import {
  fetchTokenvesting,
  getCloseInstruction,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '../src'
// @ts-ignore error TS2307 suggest setting `moduleResolution` but this is already configured
import { loadKeypairSignerFromFile } from 'gill/node'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

describe('tokenvesting', () => {
  let payer: KeyPairSigner
  let tokenvesting: KeyPairSigner

  beforeAll(async () => {
    tokenvesting = await generateKeyPairSigner()
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
  })

  it('Initialize Tokenvesting', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getInitializeInstruction({ payer: payer, tokenvesting: tokenvesting })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSER
    const currentTokenvesting = await fetchTokenvesting(rpc, tokenvesting.address)
    expect(currentTokenvesting.data.count).toEqual(0)
  })

  it('Increment Tokenvesting', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({
      tokenvesting: tokenvesting.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchTokenvesting(rpc, tokenvesting.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Increment Tokenvesting Again', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({ tokenvesting: tokenvesting.address })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchTokenvesting(rpc, tokenvesting.address)
    expect(currentCount.data.count).toEqual(2)
  })

  it('Decrement Tokenvesting', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getDecrementInstruction({
      tokenvesting: tokenvesting.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchTokenvesting(rpc, tokenvesting.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Set tokenvesting value', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getSetInstruction({ tokenvesting: tokenvesting.address, value: 42 })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchTokenvesting(rpc, tokenvesting.address)
    expect(currentCount.data.count).toEqual(42)
  })

  it('Set close the tokenvesting account', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getCloseInstruction({
      payer: payer,
      tokenvesting: tokenvesting.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    try {
      await fetchTokenvesting(rpc, tokenvesting.address)
    } catch (e) {
      if (!isSolanaError(e)) {
        throw new Error(`Unexpected error: ${e}`)
      }
      expect(e.message).toEqual(`Account not found at address: ${tokenvesting.address}`)
    }
  })
})

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction)
}
