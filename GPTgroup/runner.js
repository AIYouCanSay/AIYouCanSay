// run multiple .js files
const { fork } = require('child_process');

// topic leader
fork('./TopicLeader.js');

// specialist group
fork('./SpecialistGroup.js');