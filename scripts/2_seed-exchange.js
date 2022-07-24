const { ethers } = require('hardhat')

const tokens = (n) => 
{
    let value = ethers.utils.parseUnits(n.toString(), 'ether')
    return value
}

const wait = (seconds) =>
{
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main()
{
    // Fetch accounts from wallet, these are unlocked
    const accounts = await ethers.getSigners()

    const DApp = await ethers.getContractAt('Token', '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0')
    console.log(`DApp Token fetched: ${DApp.address}`)

    const mETH = await ethers.getContractAt('Token', '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82')
    console.log(`mETH Token fetched: ${mETH.address}`)

    const mDAI = await ethers.getContractAt('Token', '0x9A676e781A523b5d0C0e43731313A708CB607508')
    console.log(`mDAI Token fetched: ${mDAI.address}`)

    const exchange = await ethers.getContractAt('Exchange', '0x0B306BF915C4d645ff596e518fAf3F9669b97016')
    console.log(`Exchange fetched: ${exchange.address}`)

    // deployer
    const sender = accounts[0]

    const receiver = accounts[1]

    let amount = tokens(10000)

    // user1 transfers 10,000 mETH
    let transaction, result
    transaction = await mETH.connect(sender).transfer(receiver.address, amount)
    console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`)

    const user1 = accounts[0]
    const user2 = accounts[1]
    amount = tokens(10000)

    // user1 approves 10,000 Dapp
    transaction = await DApp.connect(user1).approve(exchange.address, amount)
    result = await transaction.wait()
    console.log(`Approved ${amount} Dapp tokens from ${user1.address}`)

    // user1 deposits 10,000 Dapp
    transaction = await exchange.connect(user1).depositToken(DApp.address, amount)
    await transaction.wait()
    console.log(`Deposited ${amount} Dapp tokens from ${user1.address}`)

    // user2 approves mETH
    transaction = await mETH.connect(user2).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`Approved ${amount} mETH tokens from ${user2.address}`)

    transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
    await transaction.wait()
    console.log(`Deposited ${amount} mETH tokens from ${user2.address}`)

    

    // Seed a cancelled order
     
    // user1 makes order to get tokens
    let orderId
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(5))

    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    // user1 cancels order
    orderId = result.events[0].args._id
    transaction = await exchange.connect(user1).cancelOrder(orderId)
    result = await transaction.wait()
    console.log(`Cancelled order from ${user1.address}\n`)

    // wait 1 second
    await wait(1)

    // Seed filled orders


    // user1 makes order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(10))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    // user2 fills order
    orderId = result.events[0].args._id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from ${user1.address}`)

    // wait 1 second
    await wait(1)

    // user1 makes another order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(50), DApp.address, tokens(15))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    // user2 fills another order
    orderId = result.events[0].args._id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from ${user1.address}`)

    // wait 1 second
    await wait(1)

    // user1 makes final order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), DApp.address, tokens(20))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    // user2 fills final order
    orderId = result.events[0].args._id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from ${user1.address}`)

     // wait 1 second
     await wait(1) 


     // Seed open orders

     // user1 makes 10 orders
    for (let i = 1; i <= 10; ++i)
    {
        transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), DApp.address, tokens(10))
        result = await transaction.wait()
        console.log(`Made order from ${user1.address}`)
        // wait 1 second
        await wait(1) 
    }

    // user2 makes 10 orders
    for (let i = 1; i <= 10; ++i)
    {
        transaction = await exchange.connect(user2).makeOrder(DApp.address, tokens(10), mETH.address, tokens(10 * i))
        result = await transaction.wait()
        console.log(`Made order from ${user2.address}`)
        // wait 1 second
        await wait(1)
    }

}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.log(error)
  process.exit(1)
})
