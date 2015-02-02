Package.describe({
  name: 'ethereum:dapp-styles',
  version: '0.0.1',
  summary: 'Simple CSS framework for ethereum DApps',
  git: 'http://github.com/ethereum/meteor-dapp-styles',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');

  api.use('less', 'client');

  api.addFiles('normalize.import.less', 'client');
  api.addFiles('lesshat.import.less', 'client');
  api.addFiles('entypoicons.import.less', 'client');
  api.addFiles('mixins.import.less', 'client');
  api.addFiles('containers.import.less', 'client');
  api.addFiles('elements.import.less', 'client');
  api.addFiles('buttons.import.less', 'client');
  api.addFiles('fonts.import.less', 'client');
  api.addFiles('constants.import.less', 'client');
  api.addFiles('responsive.import.less', 'client');
  api.addFiles('dapp-main.less', 'client');
});

Package.onTest(function(api) {
  // api.use('tinytest');
  // api.use('ethereum:dapp-styles');
  // api.addFiles('ethereum:dapp-styles-tests.js');
});
