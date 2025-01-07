require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: '0.8.18',
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
  },
  paths: {
    artifacts: './artifacts',
  },
  // Add this section
  rpc: {
    host: 'localhost',
    port: 8545,
  },
  // And this section
  mocha: {
    timeout: 20000,
  },
};
