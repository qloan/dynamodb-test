var uuid = require('node-uuid');

var util = exports;

util.random = function(min, max) {
	min = min || 0;
	max = max || 99999;
    return Math.floor(Math.random() * ((max-min)+1) + min);
};

util.uuid = uuid;
