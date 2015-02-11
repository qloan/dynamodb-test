var util = require('./util'),
    table = exports;

table.exists = function(tbl) {
    return (this[tbl]) ? true : false;
};

table.tableLen = function(tbl) {
    return (this[tbl].length) ? this[tbl].length : 0;
};

table.get = function(tbl, pos) {
    var len = this[tbl].length;

    pos = (pos) ? pos : util.random(0, len-1);
    return this[tbl][pos];
};

table.getInsertConditionExpression = function(tbl) {
    return this.insertConditionExpressions[tbl];    
};


/***************************************************/

table.insertConditionExpressions = {
    clients : 'attribute_not_exists(email)',
    loans   : 'attribute_not_exists(email) AND attribute_not_exists(loan_id)'
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
}];
