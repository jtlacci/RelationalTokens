
var erc721y = artifacts.require("./erc721y.sol");

module.exports = function(deployer) {
  deployer.deploy(erc721y);
};
