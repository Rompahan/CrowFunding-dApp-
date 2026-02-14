// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RewardToken.sol";

contract CrowdFund {
    struct Campaign {
        string title;
        address payable owner;
        uint256 goalWei;
        uint256 deadline;
        uint256 totalRaised;
        bool finalized;
        bool successful;
    }

    RewardToken public rewardToken;
    uint256 public rewardRate;
    uint256 public campaignCount;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event CampaignCreated(uint256 indexed id, address indexed owner, string title, uint256 goalWei, uint256 deadline);
    event Contributed(uint256 indexed id, address indexed contributor, uint256 amountWei, uint256 rewardMinted);
    event Finalized(uint256 indexed id, bool successful);
    event Withdrawn(uint256 indexed id, address indexed owner, uint256 amount);
    event Refunded(uint256 indexed id, address indexed contributor, uint256 amount);

    constructor(address tokenAddress, uint256 _rewardRate) {
        rewardToken = RewardToken(tokenAddress);
        rewardRate = _rewardRate;
    }

    function createCampaign(string calldata title, uint256 goalWei, uint256 durationSeconds) external returns (uint256) {
        require(goalWei > 0, "goal=0");
        require(durationSeconds > 0, "duration=0");

        campaignCount++;
        uint256 id = campaignCount;

        campaigns[id] = Campaign({
            title: title,
            owner: payable(msg.sender),
            goalWei: goalWei,
            deadline: block.timestamp + durationSeconds,
            totalRaised: 0,
            finalized: false,
            successful: false
        });

        emit CampaignCreated(id, msg.sender, title, goalWei, block.timestamp + durationSeconds);
        return id;
    }

    function contribute(uint256 id) external payable {
        Campaign storage c = campaigns[id];
        require(c.owner != address(0), "no campaign");
        require(block.timestamp < c.deadline, "ended");
        require(!c.finalized, "finalized");
        require(msg.value > 0, "zero");

        contributions[id][msg.sender] += msg.value;
        c.totalRaised += msg.value;

        uint256 rewardAmount = msg.value * rewardRate;
        rewardToken.mint(msg.sender, rewardAmount);

        emit Contributed(id, msg.sender, msg.value, rewardAmount);
    }

    function finalize(uint256 id) external {
        Campaign storage c = campaigns[id];
        require(msg.sender == c.owner, "not owner");
        require(c.owner != address(0), "no campaign");
        require(!c.finalized, "already");
        require(block.timestamp >= c.deadline || c.totalRaised >= c.goalWei,  "deadline not reached or goal not reached");

        c.finalized = true;

        emit Finalized(id, c.successful);
    }

    function getCampaign(uint256 id) external view returns (
        string memory title,
        address owner,
        uint256 goalWei,
        uint256 deadline,
        uint256 totalRaised,
        bool finalized,
        bool successful
    ) {
        Campaign storage c = campaigns[id];
        return (c.title, c.owner, c.goalWei, c.deadline, c.totalRaised, c.finalized, c.successful);
    }
}