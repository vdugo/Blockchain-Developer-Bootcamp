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
    let exchange

    beforeEach(async () => 
    {
        // Fetch the token from the blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Dapp University', 'DAPP', '1000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
        // pretend it's an exchange account
        exchange = accounts[2]
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

        describe('Success', () => 
        { 
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

        describe('Failure', () => 
        {
            it('rejects insufficient balances', async () => 
            {
                // Transfer more tokens than depoloyer has - 100m
                const invalidAmount = tokens(100000000)
                await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
            })

            it('rejects invalid recipient', async () => 
            {
                const amount = tokens(100)
                await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
            })
        })
    })

    describe('Approving Tokens', () => 
    { 
        let amount
        let transaction
        let result

        beforeEach(async () => 
        {
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })

        describe('Success', () => 
        {
            it('allocates an allowance for delegated token spending', async () => 
            {
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
            })

            it('emits an Approval event', async () => 
            {
                const event = result.events[0]
                expect(event.event).to.equal('Approval')
    
                const args = event.args
                expect(args._owner).to.equal(deployer.address)
                expect(args._spender).to.equal(exchange.address)
                expect(args._value).to.equal(amount)
    
            })
        }) 

        describe('Failure', () => 
        {
            it('rejects invalid spenders', async () => 
            {
                await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
            })
        }) 
    })

    describe('Delegated Token Transfers', () => 
    {
        let amount
        let transaction
        let result
        
        beforeEach(async () => 
        {
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })

        describe('Success', () => 
        { 
            beforeEach(async () => 
            {
                transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount)
                result = await transaction.wait()
            })

            it('transfers token balances', async () => 
            {
                expect(await token.balanceOf(deployer.address)).to.be.equal(tokens('999900'))
                expect(await token.balanceOf(receiver.address)).to.be.equal(amount) 
            })

            it('resets the allowance', async () => 
            {
                // check if it resets the allowance back to 0
                expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)
            })

            it('emits a Transfer event', async () => 
            {
                const event = result.events[0]
                expect(event.event).to.equal('Transfer')

                const args = event.args
                expect(args._from).to.equal(deployer.address)
                expect(args._to).to.equal(receiver.address)
                expect(args._value).to.equal(amount)
            })
        })

        describe('Failure', async () => 
        { 
            it('rejects an invalid transfer amount', async () => 
            {
                const invalidAmount = tokens(100000000)
                await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
            })
        })
    })

})
