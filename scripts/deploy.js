const hre = require('hardhat');

async function main() {
  // Get the contract factory
  const Voting = await hre.ethers.getContractFactory('Voting');

  // Deploy the contract
  const voting = await Voting.deploy();

  // Wait for the deployment transaction to be mined
  await voting.waitForDeployment();

  // Get the deployed contract address
  const address = await voting.getAddress();

  console.log('Voting contract deployed to:', address);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
