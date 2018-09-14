/**
wallet config variables

@property publicSettings
*/
publicSettings = {
  name: 'Ethereum',
  title: 'Ethereum',
  ticker: 'ETH',
  unit: 'ETHER',
  ether: 'ether',
  Ether: 'Ether',
  ethereum: 'ethereum',
  Ethereum: 'Ethereum',
  walletName: 'Ethereum Wallet',
  walletDescription: 'The Ethereum Wallet',
  walletKeywords: 'wallet, dapp, Ether',
  downloadUrl: 'https://github.com/ethereum/mist/releases',
  blockExplorerUrl: 'https://etherscan.io',
  blockExplorerAddrUrl: 'https://etherscan.io/address/',
  geth: 'geth',
  gethIpc: 'geth.ipc',
  gethConnectionUrl: 'ws://localhost:8546'
};

try {
  console.info('load publicSettings...');
  _.extend(publicSettings, Meteor.settings.public);
} catch (e) {
  console.error('Fail to load Meteor.settings.public.');
  console.info(Meteor.settings.public);
}
