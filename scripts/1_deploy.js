const { ethers } = require('hardhat')

async function main()
{
  console.log(`Preparing deployment of smart contracts onto the blockchain...\n`)

  // Fetch contracts to deploy
  const Token = await ethers.getContractFactory('Token')
  const Exchange = await ethers.getContractFactory('Exchange')

  // Fetch accounts
  const accounts = await ethers.getSigners()

  console.log(`Accounts fetched:\n ${accounts[0].address} \n ${accounts[1].address} \n`)

  // Deploy contracts
  
  const DApp = await Token.deploy('Dapp University', 'DAPP', '1000000')
  await DApp.deployed()
  console.log(`DAPP Token deployed to ${DApp.address}`)

  const mETH = await Token.deploy('mETH', 'mETH', '1000000')
  await mETH.deployed()
  console.log(`mETH Token deployed to ${mETH.address}`)

  const mDAI = await Token.deploy('mDAI', 'mDAI', '1000000')
  await mDAI.deployed()
  console.log(`mDAI Token deployed to ${mDAI.address}`)

  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`Exchange deployed to ${exchange.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
