#!/usr/local/bin/node

var AWS = require('aws-sdk'),
    DOC = require('dynamodb-doc'),
    seedData = require('./lib/seed-data'),
    awsClient,
    docClient,
    cmd;

//SET API CONFIG VALUES
AWS.config.update({
    credentials: new AWS.SharedIniFileCredentials({profile: 'default'}),
    region:      'us-west-2',
    sslEnabled:  false,
    apiVersions: {
        dynamodb: '2012-08-10',
        ec2:      '2013-02-01',
        redshift: 'latest'
    }
});

//CREATE DYNAMODB INSTANCE
awsClient = new AWS.DynamoDB();
docClient = new DOC.DynamoDB(awsClient);

//GENERIC CALLBACK HANDLER
function handler(err, data) { 
    if (err) {
        console.log(err, err.stack);
    } else {
        console.dir(data);
    }
}

cmd = process.argv[2];

if(cmd == 'listTables') {

    docClient.listTables({}, handler);

}else if(cmd == 'seed') {

    (function() {
        var tableName = process.argv[3],
            recordCount = (process.argv[4]) ? process.argv[4] : 0,
            n;

        if(!seedData.exists(tableName)) {
            console.log('Invalid table name');
            return 9;
        }
        
        recordCount = Math.min(recordCount, seedData.tableLen(tableName));
        for(n=0; n<recordCount; n++) {
            //insert item
            docClient.putItem({
                TableName: tableName,
                Item: seedData.get(tableName),
                ConditionExpression: seedData.getInsertConditionExpression(tableName)  //ensure doesn't already exist. without this, item would be overwritten.
            }, handler);
        }
    })();

}else if(cmd == 'initTables') {

    (function() {

    })();

}else {
    console.log('Invalid command.');
    return 9;
}

/*
//GET ITEM
docClient.getItem({
    TableName: 'my_first_table',
    Key: {
        my_id: '2',
        company: 'Quicken Loans'
    }
}, handler);

return;

docClient.query({
    TableName: 'my_first_table',
    KeyConditions: [
        docClient.Condition('my_id', 'EQ', '2'),
        docClient.Condition('company', 'GT', 'Z')
    ]
}, handler);
*/