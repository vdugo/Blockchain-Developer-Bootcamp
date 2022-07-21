const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Token', () => 
{
    const tokens = (n) => 
    {
        let value = ethers.utils.parseUnits(n.toString(), 'ether')
        return value
    }

    let token
    let accounts
    let deployer
    let receiver

    beforeEach(async () => 
    {
        // Fetch the token from the blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Dapp University', 'DAPP', '1000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
    })

    describe('Deployment', () => 
    {
        const name = 'Dapp University'
        const symbol = 'DAPP'
        const decimals = '18'
        const totalSupply = tokens('1000000')

        it('has correct name', async () => 
        {
            expect(await token.name()).to.equal('Dapp University')
        })
    
        it('has correct symbol', async () => 
        {
            expect(await token.symbol()).to.equal('DAPP')
        })
    
        it('has correct decimals', async () => 
        {
            expect(await token.decimals()).to.equal(18)
        })
    
        it('has correct total supply', async () => 
        {
            
            expect(await token.totalSupply()).to.equal(tokens('1000000'))
        })

        it('assigns total supply to deployer', async () => 
        {
            expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
        })
    })

    describe('Sending Token', () => 
    {
        let amount
        let transaction
        let result

        beforeEach(async () => 
        {
            amount = tokens(100)
            transaction = await token.connect(deployer).transfer(receiver.address, amount)
            result = await transaction.wait()
        })

        it('transfers token balances', async () => 
        {
            expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
            expect(await token.balanceOf(receiver.address)).to.equal(amount)
        })

        it('emits a transfer event', async () => 
        {
            const event = result.events[0]
            expect(event.event).to.equal('Transfer')

            const args = event.args
            expect(args._from).to.equal(deployer.address)
            expect(args._to).to.equal(receiver.address)
            expect(args._value).to.equal(amount)

        })
    })

})
