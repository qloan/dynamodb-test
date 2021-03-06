#!/usr/local/bin/node

var vogels = require('vogels');
var joi    = require('joi');
var seedData = require('./lib/seed-data');

//CREATE VOGELS INSTANCE
vogels.AWS.config.update({
    credentials: new vogels.AWS.SharedIniFileCredentials({profile: 'default'}),
    region:      'us-west-2',
    sslEnabled:  false,
    apiVersions: {
        dynamodb: '2012-08-10'
    }
});

//CREATE A LOW-LEVEL DYNAMODB INSTANCE. THE CONSTRUCTOR IS ACCESSIBLE FROM VOGELS
var AWS = new vogels.AWS.DynamoDB();

//DEFINE CLIENT MODEL
var Client = vogels.define('Client', {
    hashKey: 'client_id',
    schema: {
    	client_id : vogels.types.uuid(),
        email     : joi.string().email(),
        password  : joi.string(),
        personalInformation     : joi.object().optional().keys({
        	firstName			: joi.string(),
        	lastName            : joi.string(),
        	streetAddress       : joi.string(),
        	city                : joi.string(),
        	state               : joi.string(),
        	zip                 : joi.number(),
        	birthdate           : joi.number(), // unix epoch time
        	income              : joi.number()
        }),
        campaign_referral: joi.string()
    }
});

//DEFINE LOAN MODEL
var Loan = vogels.define('Loan', {
    hashKey: 'loan_id',
    rangeKey: 'timestamp',
    schema: {
        client_id    : vogels.types.uuid(),
        loan_id      : vogels.types.uuid(),
        timestamp	 : joi.number(), // unix epoch time
        amount       : joi.number(),
        rate         : joi.number(),
        status		 : joi.string().required(),
        bankAccount  : joi.object().optional().keys({
        	routing  	 : joi.number().min(100000000).max(999999999),
        	account  	 : joi.number().min(1000).max(99999999999999)
        }),
        duration     : joi.number(),
        creditReport : joi.object().keys({
            score        : joi.number(),
            latePayments : joi.number()
        })
    }
});

//GENERIC CALLBACK HANDLER
function handler(err, data) { 
    if (err) {
        console.log(err, err.stack);
    } else {
        console.dir(data);
    }
}

//GET CLI ARGUMENTS
cmd = process.argv[2];
tableName = process.argv[3];

if(cmd == 'createTables') {
    AWS.createTable({
        TableName: 'clients',
        AttributeDefinitions: [{
            AttributeName: 'client_id',
            AttributeType: 'S'
        }],
        KeySchema: [{
            AttributeName: 'client_id',
            KeyType: 'HASH'
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 2
        }
    }, handler);

    AWS.createTable({
        TableName: 'loans',
        AttributeDefinitions: [{
            AttributeName: 'loan_id',
            AttributeType: 'S'
        }, {
            AttributeName: 'timestamp',
            AttributeType: 'N'
        }],
        KeySchema: [{
            AttributeName: 'loan_id',
            KeyType: 'HASH'
        }, {
            AttributeName: 'timestamp',
            KeyType: 'RANGE'
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 2
        }
    }, handler);

}else if(cmd == 'listTables') {

    AWS.listTables({}, handler);

}else if(cmd == 'descTable') {

    AWS.describeTable({
        TableName: tableName
    }, handler);

}else if(cmd == 'seedTable') {

    (function() {
        var recordCount,
            params = {
                ConditionExpression: seedData.getInsertConditionExpression(tableName)
            },
            rec,
            n;

        if(!seedData.exists(tableName)) {
            console.log('Invalid table name');
            return 9;
        }
        
        recordCount = seedData.tableLen(tableName);

        for(n=0; n<recordCount; n++) {
            
            rec = seedData.get(tableName, n);

            if(tableName == 'clients') {
                Client.create({
                	client_id: rec.client_id,
                    email    : rec.email,
                    password : rec.password,
                    personalInformation: {
			        	firstName			: rec.personalInformation.firstName,
			        	lastName            : rec.personalInformation.lastName,
			        	streetAddress       : rec.personalInformation.streetAddress,
			        	city                : rec.personalInformation.city,
			        	state               : rec.personalInformation.state,
			        	zip                 : rec.personalInformation.zip,
			        	birthdate           : rec.personalInformation.birthdate,
			        	income              : rec.personalInformation.income
                    },
			        campaign_referral: rec.campaign_referral
                }, params, handler);
            }else if(tableName == 'loans') {
                Loan.create({
                    client_id    : rec.client_id,
                    loan_id      : rec.loan_id,
                    timestamp	 : (new Date()).getTime(),
                    amount       : rec.amount,
                    rate         : rec.rate,
                    status		 : rec.status,
                    duration     : rec.duration,
			        bankAccount  : {
			        	routing  	 : rec.bankAccount.routing,
			        	account  	 : rec.bankAccount.account
			        },
                    creditReport : {
                        score        : rec.creditReport.score,
                        latePayments : rec.creditReport.latePayments
                    }
                }, params, handler);
            }
        }
    })();

}else if(cmd == 'seedTables') {

    var params = {},
    	recordCount = seedData.tableLen('clients');

    console.log('Creating ' + recordCount + ' client documents...');

    seedData.clients.forEach(function (rec) {
        Client.create(rec, params, handler);
    });

    recordCount = seedData.tableLen('loans');
    console.log('Creating ' + recordCount + ' loan documents...');
        
    seedData.loans.forEach(function (rec) {
        Loan.create(rec, params, handler);
    });

}else if(cmd == 'clearTable') {

    (function() {
        var model;
        if(tableName == 'clients') {
            model = Client;
        }else if(tableName == 'loans') {
            model = Loan;
        }
    
        //scan for all items in specified table. For each 
        //item, generate the key object and delete the item
        model.scan().loadAll().exec(function(err, data) {
            data.Items.forEach(function(item) {
                model.destroy(seedData.getDeleteKeys(tableName, item.attrs), handler);
            });
        });
    })();

}else if(cmd == 'getItem') {

    (function() {
        var model;
        var key = eval('(' + process.argv[4] + ')');
        var params = {
            ConsistentRead: true
        };

        if(tableName == 'clients') {
            model = Client;
        }else if(tableName == 'loans') {
            model = Loan;
        }

        model.get(key, params, handler);
    })();

}else if(cmd == 'query') {

    (function() {
        var model;

        if(tableName == 'clients') {
            model = Client;
        }else if(tableName == 'loans') {
            model = Loan;
        }

        model
            .query('asdf@test.com')
            .filterExpression('#duration >= :duration and #creditReport.score > :score')
            .expressionAttributeNames({
                '#duration'     : 'duration',
                '#creditReport' : 'creditReport'
            })
            .expressionAttributeValues({
                ':duration' : 30,
                ':score'    : 700
            })
            .exec(handler);
    })();

}else if(cmd == 'scan') {

    (function() {
        var model;

        if(tableName == 'clients') {
            model = Client;
        }else if(tableName == 'loans') {
            model = Loan;
        }

        model
            .scan()
            //.where('duration').gte(30) //filter expression can also be written cleaner this way. See docs.
            .filterExpression('#duration >= :duration and #creditReport.score > :score')
            .expressionAttributeNames({
                '#duration'     : 'duration',
                '#creditReport' : 'creditReport'
            })
            .expressionAttributeValues({
                ':duration' : 30,
                ':score'    : 700
            })
            .exec(handler);
    })();

}else if(cmd == 'update') {

    (function() {
        var model;

        var params = {
            UpdateExpression: 'set #rate = :rate',
            ExpressionAttributeNames: {
                '#rate': 'rate'
            },
            ExpressionAttributeValues: {
                ':rate': 4.125
            }
        };

        if(tableName == 'clients') {
            model = Client;
        }else if(tableName == 'loans') {
            model = Loan;
        }

        model.update({
            email: 'asdf@test.com',
            loan_id: 1001
        }, params, handler);
    })();

}else if(cmd == 'getAllItems') {

    (function() {
        var model;

        if(tableName == 'clients') {
            model = Client;
        }else if(tableName == 'loans') {
            model = Loan;
        }

        model.scan().loadAll().exec(handler);
    })();

}else {

    console.log('Invalid command.\n');
    console.log([
        '\nUsage: vogels.js [command] [command arguments]\n',
        'Valid Commands:',
        '---------------',
        'createTables.................... Create tables for all examples',
        'listTables...................... List all tables in DynamoDB account',
        'descTable [table name].......... Describe specified table',
        'seedTable [table name].......... Seed the specified table with dummy data',
        'clearTable [table name]......... Delete all items in the specified table',
        'getAllItems [table name]........ Get all items in specified table',
        'getItem [table name] [key]...... Get single item from specified table. Key is a json object which must reflect primary key',
        'query [table name].............. Run query against specified table. NOTE: Query criteria is hard-coded and must be tweaked manually',
        'scan [table name]............... Run a full table scan against specified table. NOTE: Scan criteria is hard-coded and must be tweaked manually',
        'update [table name]............. Update single item on specified table. NOTE: Update criteria is hard-coded and must be tweaked manually'
    ].join('\n'));
    return 9;
}