const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Exchange', () => 
{
    const tokens = (n) => 
    {
        let value = ethers.utils.parseUnits(n.toString(), 'ether')
        return value
    }
    let deployer
    let feeAccount
    let exchange

    beforeEach(async () => 
    {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]

        // Fetch the token from the blockchain
        const Exchange = await ethers.getContractFactory('Exchange')
        exchange = await Exchange.deploy(feeAccount.address)
    })

    describe('Deployment', () => 
    {
        it('tracks the fee account', async () => 
        {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
    }) 
})
