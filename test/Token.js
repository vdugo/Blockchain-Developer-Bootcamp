const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Token', () => 
{
    let token

    beforeEach(async () => 
    {
        // Fetch the token from the blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy()
    })

    it('has correct name', async () => 
    {
        // Read token name
        const name = await token.name()
        // Check that name is correct
        expect(name).to.equal('Dapp University')
    })

    it('has correct symbol', async () => 
    {
        // Read token name
        const symbol = await token.symbol()
        // Check that name is correct
        expect(symbol).to.equal('DAPP')
    })
})