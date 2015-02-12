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
    clients: ['email'],
    loans: ['email', 'loan_id']
};

table.clients = [{
    email: 'asdf@test.com',
    password: '1234',
    address: '123 Woodward Ave'
}, {
    email: 'joeuser@quickenloans.com',
    password: '2345',
    address: '1400 Farmer St'
}, {
    email: 'john@qwerty.com',
    password: '4323',
    address: '1312 Gratiot St'
}];

table.loans = [{
    email: 'asdf@test.com',
    loan_id: 1000,
    amount: 1829.12,
    rate: 6.5,
    duration: 60,
    creditReport: {
        score: 750,
        latePayments: 0
    }
}, {
    email: 'asdf@test.com',
    loan_id: 1001,
    amount: 1829.12,
    rate: 12.375,
    duration: 36,
    creditReport: {
        score: 700,
        latePayments: 1
    }
}, {
    email: 'asdf@test.com',
    loan_id: 1002,
    amount: 1829.12,
    rate: 24,
    duration: 24,
    creditReport: {
        score: 658,
        latePayments: 1
    }
}, {
    email: 'joeuser@quickenloans.com',
    loan_id: 1003,
    amount: 1829.12,
    rate: 9.75,
    duration: 24,
    creditReport: {
        score: 712,
        latePayments: 0
    }
}, {
    email: 'joeuser@quickenloans.com',
    loan_id: 1004,
    amount: 1829.12,
    rate: 18.25,
    duration: 36,
    creditReport: {
        score: 689,
        latePayments: 1
    }
}, {
    email: 'john@qwerty.com',
    loan_id: 1005,
    amount: 1829.12,
    rate: 5.25,
    duration: 60,
    creditReport: {
        score: 702,
        latePayments: 0
    }
}, {
    email: 'john@qwerty.com',
    loan_id: 1006,
    amount: 1829.12,
    rate: 15.5,
    duration: 60,
    creditReport: {
        score: 732,
        latePayments: 0
    }
}, {
    email: 'john@qwerty.com',
    loan_id: 1007,
    amount: 1829.12,
    rate: 19.875,
    duration: 36,
    creditReport: {
        score: 747,
        latePayments: 1
    }
}, {
    email: 'john@qwerty.com',
    loan_id: 1008,
    amount: 1829.12,
    rate: 6,
    duration: 36,
    creditReport: {
        score: 702,
        latePayments: 0
    }
}];
