import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import config from '../config.json'
import { 
  loadProvider, 
  loadNetwork, 
  loadAccount, 
  loadTokens,
  loadExchange,
  subscribeToEvents
} from '../store/interactions'

import Navbar from './Navbar'
import Markets from './Markets'
import Balance from './Balance'
import Order from './Order'


function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async () =>
  {
    // connect Ethers to the blockchain
    const provider = loadProvider(dispatch)
    // fetch current network's chainId (e.g. Hardhat 31337, Kovan 42)
    const chainId = await loadNetwork(provider, dispatch)

    // Reload page when network changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })
    // fetch current account and balance from Metamask
    window.ethereum.on('accountsChanged', () => {
       loadAccount(provider, dispatch)
    })
    // load token smart contracts
    const DApp = config[chainId].DApp
    const mETH = config[chainId].mETH
    const mDAI = config[chainId].mDAI
    // load exchange smart contract
    const exchangeConfig = config[chainId].exchange

    // Token smart contract
    await loadTokens(provider, [DApp.address, mETH.address], dispatch)

    // Exchange smart contract
    const exchange = await loadExchange(provider, exchangeConfig.address, dispatch)

    // Listen to events
    subscribeToEvents(exchange, dispatch)
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

          <Markets />

          <Balance />

          <Order />

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
