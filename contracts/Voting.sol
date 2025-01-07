// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Proposal {
        string name;
        uint voteCount;
    }

    Proposal[] public proposals;
    mapping(address => bool) public voters;

    event ProposalAdded(string name);
    event Voted(address voter, uint proposalIndex);

    function addProposal(string memory _name) public {
        proposals.push(Proposal({
            name: _name,
            voteCount: 0
        }));
        emit ProposalAdded(_name);
    }

    function vote(uint _proposalIndex) public {
        require(!voters[msg.sender], "Already voted.");
        require(_proposalIndex < proposals.length, "Invalid proposal index.");

        voters[msg.sender] = true;
        proposals[_proposalIndex].voteCount++;

        emit Voted(msg.sender, _proposalIndex);
    }

    function getProposals() public view returns (Proposal[] memory) {
        return proposals;
    }
}