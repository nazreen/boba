const ethers = require('ethers')
const ethSigUtil = require('eth-sig-util')
const YAML = require('yaml')
const fs = require('fs')

// Support local tests
require('dotenv').config()

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Strict-Transport-Security': 'max-age=63072000; includeSubdomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': '*',
}

// Load contracts
const loadContracts = () => {
  // Load env
  let env = process.env
  if (fs.existsSync('./env.yml')) {
    const file = fs.readFileSync('./env.yml', 'utf8')
    env = YAML.parse(file)
  }
  const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL || process.env.L2_NODE_WEB3_URL
  const PRIVATE_KEY = env.PRIVATE_KEY || process.env.PRIVATE_KEY
  const BOBA_GASPRICEORACLE_ADDRESS =
    env.BOBA_GASPRICEORACLE_ADDRESS || process.env.BOBA_GASPRICEORACLE_ADDRESS
  const L2_SECONDARY_FEE_TOKEN_ADDRESS = env.L2_SECONDARY_FEE_TOKEN_ADDRESS

  // Get provider and wallet
  const l2Provider = new ethers.providers.JsonRpcProvider(L2_NODE_WEB3_URL)
  const l2Wallet = new ethers.Wallet(PRIVATE_KEY).connect(l2Provider)

  // ABI
  const BobaGasPriceOracleInterface = new ethers.utils.Interface([
    'function useBobaAsFeeToken()',
    'function useSecondaryFeeTokenAsFeeToken()',
    'function secondaryFeeTokenUsers(address) view returns (bool)',
    'function swapSecondaryFeeTokenForBOBAMetaTransaction(address,address,uint256,uint256,uint8,bytes32,bytes32)',
    'function metaTransactionFee() view returns (uint256)',
    'function marketPriceRatio() view returns (uint256)',
    'function receivedBOBAAmount() view returns (uint256)',
    'function getSecondaryFeeTokenForSwap() view returns (uint256)',
  ])

  const L2SecondaryFeeTokenInterface = new ethers.utils.Interface([
    'function balanceOf(address) view returns (uint256)',
  ])

  // Load contracts
  const Boba_GasPriceOracle = new ethers.Contract(
    BOBA_GASPRICEORACLE_ADDRESS,
    BobaGasPriceOracleInterface,
    l2Wallet
  )
  const L2SecondaryFeeToken = new ethers.Contract(
    L2_SECONDARY_FEE_TOKEN_ADDRESS,
    L2SecondaryFeeTokenInterface,
    l2Wallet
  )

  return [Boba_GasPriceOracle, L2SecondaryFeeToken]
}

// Decrypt the signature and verify the message
// Verify the user balance and the value
const verifyBobay = async (body, Boba_GasPriceOracle, L2SecondaryFeeToken) => {
  const { owner, spender, value, deadline, signature, data } = body

  if (
    typeof owner === 'undefined' ||
    typeof spender === 'undefined' ||
    typeof value === 'undefined' ||
    typeof deadline === 'undefined' ||
    typeof signature === 'undefined' ||
    typeof data === 'undefined'
  ) {
    return {
      isVerified: false,
      errorMessage: 'Missing parameters',
    }
  }

  const decryptOwner = ethSigUtil.recoverTypedMessage({
    data,
    sig: signature,
  })

  if (
    ethers.utils.getAddress(decryptOwner) !== ethers.utils.getAddress(owner)
  ) {
    return {
      isVerified: false,
      errorMessage: 'Invalid signature',
    }
  }

  const totalCost = await Boba_GasPriceOracle.getSecondaryFeeTokenForSwap()
  const L2SecondaryFeeTokenBalance = await L2SecondaryFeeToken.balanceOf(owner)
  const bigNumberValue = ethers.BigNumber.from(value)
  if (bigNumberValue.lt(totalCost)) {
    return {
      isVerified: false,
      errorMessage: 'Invalid value',
    }
  }
  if (bigNumberValue.gt(L2SecondaryFeeTokenBalance)) {
    return {
      isVerified: false,
      errorMessage: 'Insufficient balance',
    }
  }

  return {
    isVerified: true,
  }
}

// Verify message and send to node if it's correct
const handle = async (event, callback) => {
  const body = JSON.parse(event.body)

  const [Boba_GasPriceOracle, L2SecondaryFeeToken] = loadContracts()
  const isVerified = await verifyBobay(
    body,
    Boba_GasPriceOracle,
    L2SecondaryFeeToken
  )
  if (isVerified.isVerified === false) {
    return callback(null, {
      headers,
      statusCode: 400,
      body: JSON.stringify({
        status: 'failure',
        error: isVerified.errorMessage,
      }),
    })
  }

  const { owner, spender, value, deadline, signature } = body
  // Get r s v from signature
  const sig = ethers.utils.splitSignature(signature)
  // Send transaction to node
  try {
    const tx =
      await Boba_GasPriceOracle.swapSecondaryFeeTokenForBOBAMetaTransaction(
        owner,
        spender,
        value,
        deadline,
        sig.v,
        sig.r,
        sig.s
      )
    await tx.wait()
  } catch (err) {
    return callback(null, {
      headers,
      statusCode: 400,
      body: JSON.stringify({ status: 'failure', error: err }),
    })
  }

  return callback(null, {
    headers,
    statusCode: 201,
    body: JSON.stringify({ status: 'success' }),
  })
}

module.exports.mainnetHandler = async (event, context, callback) => {
  return handle(event, callback)
}

module.exports.testnetHandler = async (event, context, callback) => {
  return handle(event, callback)
}
