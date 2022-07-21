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

    beforeEach(async () => 
    {
        // Fetch the token from the blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy()
    })

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
})