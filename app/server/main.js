// import { Meteor } from 'meteor/meteor';
const { spawn } = Npm.require('child_process');

Meteor.startup(() => {
  // code to run on server at startup
  console.log('Meteor server');
});

Meteor.methods({
  runGeth: function(port) {
    console.log(`open child process to connect to port ${port}`);
  }
});
