var util = require('./util'),
    table = exports;

table.exists = function(tbl) {
    return (this[tbl]) ? true : false;
};

table.tableLen = function(tbl) {
    return (this[tbl].length) ? this[tbl].length : 0;
};

table.get = function(tbl, pos) {
    return this[tbl][pos];
};

table.getInsertConditionExpression = function(tbl) {
    return this.insertConditionExpressions[tbl];    
};

table.getDeleteKeys = function(tbl, item) {
    var keyFields = this.deleteKeys[tbl],
        obj = {};

    keyFields.forEach(function(field) {
        obj[field] = item[field];
    });
    return obj;
};


/***************************************************/

table.insertConditionExpressions = {
    clients : 'attribute_not_exists(email)',
    loans   : 'attribute_not_exists(email) AND attribute_not_exists(loan_id)'
};

table.deleteKeys = {
    clients: ['client_id'],
    loans: ['loan_id', 'timestamp']
};

// create one static client with one static loan
// for predictable testing
table.clients = [{
	client_id: '123e4567-e89b-12d3-a456-426655440000',
    email: 'willyp@gmail.com',
    password: 'password1234',
    personalInformation: {
    	firstName: 'Willy',
    	lastName: 'P',
    	streetAddress: '123 Woodward Ave',
    	city: 'Detroit',
    	state: 'MI',
    	zip: 48208,
    	birthdate: (new Date('12-25-1980')).getTime(),
    	income: 99999
    },
    campaign_referral: 'mkt123'
}];

table.loans = [{
    client_id: '123e4567-e89b-12d3-a456-426655440000',
    loan_id: '123e4567-e89b-12d3-a456-426655440001',
    timestamp: (new Date('12-25-1980')).getTime(),
    amount: 1829.12,
    rate: 6.5,
    status: 'approved',
    bankAccount: {
    	routing: 555555555,
    	account: 555555555
    },
    duration: 60,
    creditReport: {
        score: 750,
        latePayments: 0
    }
}];

// generate random clients each with 0-2 loans
var maxClients = 100,
	statusOpts = [
		'application',
		'approved',
		'funded',
		'default',
		'closed'
	];

function getRandomStatus() {
	var randomIndex = util.random(0, statusOpts.length - 1);
	return statusOpts[randomIndex];
}


for (var c = 1; c < maxClients; c++) {
	var randomClient = new RandomClient();
	table.clients.push(randomClient);

	var numberOfLoans = util.random(0, 3);
	for (var l = 0; l < numberOfLoans; l++) {
		var randomLoan = new RandomLoan(randomClient.client_id);
		table.loans.push(randomLoan);
	}
}


function RandomClient() {
	return {
		client_id: util.uuid.v4(),
        timestamp: (new Date()).getTime(),
		email: 'johndoe' + util.random() + "@gmail.com",
		password: 'password' + util.random(),
		personalInformation: {
			firstName: 'John',
			lastName: 'Doe' + util.random(),
			streetAddress: util.random(1000,9999) + " Woodward Ave",
			city: 'Detroit',
			state: 'MI',
			zip: util.random(48201, 48226),
			birthdate: (new Date(util.random(1,12) + '-' + util.random(1,28) + '-' + util.random(1900, 1997))).getTime(),
			income: util.random(40000,150000)
		},
		campaign_referral: 'mkt' + util.random(100,150)
	};
}

function RandomLoan(clientId) {
	return {
		client_id: clientId,
		loan_id: util.uuid.v4(),
		timestamp: (new Date()).getTime(),
		amount: util.random(500000,4500000) / 100, // 5,000.00 to 45,000.00
		rate: util.random(600, 2200) / 100, // 6.00% to 22.00%
		status: getRandomStatus(),
		bankAccount: {
			routing: util.random(100000000, 999999999),
			account: util.random(1000, 99999999999999)
		}, 
		duration: util.random(3, 5) * 12,
		creditReport: {
			score: util.random(400, 850),
			latePayments: util.random(0, 10)
		}
	};
}

