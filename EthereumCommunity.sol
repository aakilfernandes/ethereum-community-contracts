pragma solidity ^0.4.8;

contract EthereumCommunity {
  
  address public owner;
    
  struct Vote {
    uint256 timestamp;
    address voter;
    uint256[] choiceIds;
  }
  
  struct Delegation {
    uint256 timestamp;
    address delegator;
    address delegate;
  }
  
  struct Proposal {
    uint256 timestamp;
    bytes info;
    Vote[] votes;
  }

  Proposal[] public proposals;
  Delegation[] public delegations;
  
  function EthereumCommunity() public {
    owner = msg.sender;
  }
  
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }
      
  function transfer (address _owner) public onlyOwner() {
    owner = _owner;
  }
  
  function addProposal(bytes _info) public onlyOwner() {
    proposals.length++;
    Proposal storage proposal = proposals[proposals.length - 1];
    proposal.timestamp = block.timestamp;
    proposal.info = _info;
  }
  
  function addDelegation(address _delegate) public {
    delegations.length ++;
    Delegation storage delegation = delegations[delegations.length - 1];
    delegation.timestamp = block.timestamp;
    delegation.delegator = msg.sender;
    delegation.delegate = _delegate;
  }
  
  function addVote(uint256 _proposalId, uint256[] _choiceIds) public {
    Proposal storage proposal = proposals[_proposalId];
    proposal.votes.length++;
    Vote storage vote = proposal.votes[proposal.votes.length - 1];
    vote.timestamp = block.timestamp;
    vote.voter = msg.sender;
    vote.choiceIds = _choiceIds;
  }
  
  function proposalsLength() public view returns (uint256) {
    return proposals.length;
  }
  
  function delegationsLength() public view returns (uint256) {
    return delegations.length;
  }
  
  function votesLength(uint256 _proposalId) public view returns (uint256) {
    return proposals[_proposalId].votes.length;
  }
  
  function votes(uint256 _proposalId, uint256 _voteId) public view returns (uint256 timestamp, address voter, uint256[] choiceIds) {
    Vote storage vote = proposals[_proposalId].votes[_voteId];
    return (vote.timestamp, vote.voter, vote.choiceIds);
  }
}