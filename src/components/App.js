import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import config from '../config.json'
import { 
  loadProvider, 
  loadNetwork, 
  loadAccount, 
  loadTokens,
  loadExchange
} from '../store/interactions'

import Navbar from './Navbar'


function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async () =>
  {
    // connect Ethers to the blockchain
    const provider = loadProvider(dispatch)
    // fetch current network's chainId (e.g. Hardhat 31337, Kovan 42)
    const chainId = await loadNetwork(provider, dispatch)
    // fetch current account and balance from Metamask
    await loadAccount(provider, dispatch)
    // load token smart contracts
    const DApp = config[chainId].DApp
    const mETH = config[chainId].mETH
    const mDAI = config[chainId].mDAI
    // load exchange smart contract
    const exchange = config[chainId].exchange

    // Token smart contract
    await loadTokens(provider, [DApp.address, mETH.address], dispatch)

    // Exchange smart contract
    await loadExchange(provider, exchange.address, dispatch)
  }

  useEffect(() => 
  {
    loadBlockchainData()
  })

  return (
    <div>

      <Navbar />

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          {/* Markets */}

          {/* Balance */}

          {/* Order */}

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;
