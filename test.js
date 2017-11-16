const fs = require('fs')
const solc = require('solc')
const chai = require('chai')
const Web3 = require('web3')
const testRpc = require('ethereumjs-testrpc')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

const web3 = new Web3

const accounts = {
  alice: web3.eth.accounts.create(),
  bob: web3.eth.accounts.create(),
  charlie: web3.eth.accounts.create()
}

const accountsArray = Object.keys(accounts).map((name) => {
  return {
    secretKey: accounts[name].privateKey,
    balance: Number.MAX_SAFE_INTEGER
  }
})

web3.setProvider(testRpc.provider({ accounts: accountsArray }))

chai.should()

const gasLimit = 1000000
const gasPrice = 1

let ethereumCommunitySol
let solcOutput
let ethereumCommunity

describe('EthereumCommunity', () => {
  it('should fetch EthereumCommunity.sol', () => {
    ethereumCommunitySol = fs.readFileSync('./EthereumCommunity.sol', 'utf8')
  })
  it('should compile', () => {
    solcOutput = solc.compile(ethereumCommunitySol, 1)
    if (solcOutput.errors) {
      throw solcOutput.errors[0]
    }
  })
  it('should deploy ethereumCommunity', () => {
    const abiJson = solcOutput.contracts[':EthereumCommunity'].interface
    const abi = JSON.parse(abiJson)
    const data = `0x${solcOutput.contracts[':EthereumCommunity'].bytecode}`
    return (new web3.eth.Contract(abi)).deploy({
      data: data
    }).send({
      from: accounts.alice.address,
      gasLimit,
      gasPrice
    }).then((_ethereumCommunity) => {
      ethereumCommunity = _ethereumCommunity
    })
  })
  it('should have set alice as the owner', () => {
    return ethereumCommunity.methods.owner().call().should.eventually.equal(accounts.alice.address)
  })
  describe('transfer', () => {
    it('should reject from bob', () => {
      return ethereumCommunity.methods.transfer(accounts.bob.address).send({
        from: accounts.bob.address
      }).should.eventually.be.rejectedWith(Error)
    })
    it('should succeed from alice', () => {
      return ethereumCommunity.methods.transfer(accounts.bob.address).send({
        from: accounts.alice.address
      })
    })
  })
  describe('addProposal', () => {
    
    const info0 = '0x00'
    const info1 = '0x00'
    
    it('should reject from alice', () => {
      return ethereumCommunity.methods.addProposal(info0).send({
        from: accounts.alice.address
      }).should.eventually.be.rejectedWith(Error)
    })
    it('should add proposal0', () => {
      return ethereumCommunity.methods.addProposal(info0).send({
        from: accounts.bob.address
      })
    })
    it('proposalsLength should equal 1', () => {
      return ethereumCommunity.methods.proposalsLength().call().should.eventually.equal('1')
    })
    it('should get proposal0', () => {
      return ethereumCommunity.methods.proposals(0).call().then((proposal) => {
        return web3.eth.getBlock('latest').then((block) => {
          proposal.timestamp.should.equal(block.timestamp.toString())
          proposal.info.should.equal(info0)
        })
      })
    })
    it('should add proposal1', () => {
      return ethereumCommunity.methods.addProposal(info1).send({
        from: accounts.bob.address
      })
    })
    it('proposalsLength should equal 2', () => {
      return ethereumCommunity.methods.proposalsLength().call().should.eventually.equal('2')
    })
    it('should get proposal1', () => {
      return ethereumCommunity.methods.proposals(1).call().then((proposal) => {
        return web3.eth.getBlock('latest').then((block) => {
          proposal.timestamp.should.equal(block.timestamp.toString())
          proposal.info.should.equal(info1)
        })
      })
    })
  })
  describe('addDelegation', () => {
    it('should delegate alice to bob', () => {
      return ethereumCommunity.methods.addDelegation(accounts.bob.address).send({
        from: accounts.alice.address,
        gasLimit,
        gasPrice
      })
    })
    it('should have delegationsLength of 1', () => {
      return ethereumCommunity.methods.delegationsLength().call().should.eventually.equal('1')
    })
    it('should have added delegation0', () => {
      return ethereumCommunity.methods.delegations(0).call().then((delegation) => {
        return web3.eth.getBlock('latest').then((block) => {
          delegation.timestamp.should.equal(block.timestamp.toString())
          delegation.delegator.should.equal(accounts.alice.address)
          delegation.delegate.should.equal(accounts.bob.address)
        })
      })
    })
  })
  describe('addVote', () => {
    let blockNumber
    before(() => {
      return web3.eth.getBlock('latest').then((block) => {
        blockNumber = block.number
      })
    })
    it('should vote as alice on proposal0', () => {
      return ethereumCommunity.methods.addVote(0, [0]).send({
        gasLimit,
        gasPrice,
        from: accounts.alice.address
      })
    })
    it('should vote as bob on proposal0', () => {
      return ethereumCommunity.methods.addVote(0, [1, 2]).send({
        gasLimit,
        gasPrice,
        from: accounts.bob.address
      })
    })
    it('should vote as alice on proposal1', () => {
      return ethereumCommunity.methods.addVote(1, [3, 4]).send({
        gasLimit,
        gasPrice,
        from: accounts.alice.address
      })
    })
    it('should vote as bob on proposal1', () => {
      return ethereumCommunity.methods.addVote(1, [5]).send({
        gasLimit,
        gasPrice,
        from: accounts.bob.address
      })
    })
    it('should re-vote as bob on proposal1', () => {
      return ethereumCommunity.methods.addVote(1, []).send({
        gasLimit,
        gasPrice,
        from: accounts.bob.address
      })
    })
    it('should have votesLength of 2 for proposal0', () => {
      return ethereumCommunity.methods.votesLength(0).call().should.eventually.equal('2')
    })
    it('should get votes00', () => {
      return ethereumCommunity.methods.votes(0, 0).call().then((vote) => {
        return web3.eth.getBlock(blockNumber).then((block) => {
          vote.timestamp.should.equal(block.timestamp.toString())
          vote.voter.should.equal(accounts.alice.address)
          vote.choiceIds.should.deep.equal(['0'])
        })
      })
    })
    it('should get votes01', () => {
      return ethereumCommunity.methods.votes(0, 1).call().then((vote) => {
        return web3.eth.getBlock(blockNumber + 1).then((block) => {
          vote.timestamp.should.equal(block.timestamp.toString())
          vote.voter.should.equal(accounts.bob.address)
          vote.choiceIds.should.deep.equal(['1', '2'])
        })
      })
    })
    it('should have votesLength of 3 for proposal1', () => {
      return ethereumCommunity.methods.votesLength(1).call().should.eventually.equal('3')
    })
    it('should get votes10', () => {
      return ethereumCommunity.methods.votes(1, 0).call().then((vote) => {
        return web3.eth.getBlock(blockNumber + 2).then((block) => {
          vote.timestamp.should.equal(block.timestamp.toString())
          vote.voter.should.equal(accounts.alice.address)
          vote.choiceIds.should.deep.equal(['3', '4'])
        })
      })
    })
    it('should get votes11', () => {
      return ethereumCommunity.methods.votes(1, 1).call().then((vote) => {
        return web3.eth.getBlock(blockNumber + 3).then((block) => {
          vote.timestamp.should.equal(block.timestamp.toString())
          vote.voter.should.equal(accounts.bob.address)
          vote.choiceIds.should.deep.equal(['5'])
        })
      })
    })
    it('should get votes12', () => {
      return ethereumCommunity.methods.votes(1, 2).call().then((vote) => {
        return web3.eth.getBlock(blockNumber + 4).then((block) => {
          vote.timestamp.should.equal(block.timestamp.toString())
          vote.voter.should.equal(accounts.bob.address)
          vote.choiceIds.should.deep.equal([])
        })
      })
    })
  })
})