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

    const feePercent = 10

    beforeEach(async () => 
    {
        const Exchange = await ethers.getContractFactory('Exchange')
        const Token = await ethers.getContractFactory('Token')

        token1 = await Token.deploy('Dapp University', 'DAPP', '1000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]

        // give user1 tokens
        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
        await transaction.wait()

        // Fetch the token from the blockchain
        exchange = await Exchange.deploy(feeAccount.address, feePercent)
    })

    describe('Deployment', () => 
    {
        it('tracks the fee account', async () => 
        {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
        it('tracks the fee percent', async () => 
        {
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })

    describe('Depositing Tokens', () => 
    { 
        let transaction
        let result
        let amount

        describe('Success', () => 
        {
            beforeEach(async () => 
            {
                amount = tokens(10)
                // Approve Token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                // Deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
            })

            it('tracks the token deposit', async () => 
            {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })

            it('emits a deposit event', async () => 
            {
                const event = result.events[1] // multiple events are emitted
                expect(event.event).to.equal('Deposit')
    
                const args = event.args
                expect(args._token).to.equal(token1.address)
                expect(args._user).to.equal(user1.address)
                expect(args._amount).to.equal(amount)
                expect(args._balance).to.equal(amount)
    
            })
        })

        describe('Failure', () => 
        {
            it('fails when no tokens are approved', async () => 
            {
                await expect(exchange.connect(user1).depositToken(token1.address,amount)).to.be.reverted
            })
        })
    })
})
