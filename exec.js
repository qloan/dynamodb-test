#!/usr/local/bin/node

var AWS = require('aws-sdk'),
    DOC = require('dynamodb-doc'),
    seedData = require('./lib/seed-data'),
    awsClient,
    docClient,
    cmd,
    tableName;

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
tableName = process.argv[3];

if(cmd == 'createTables') {

    docClient.createTable({
        TableName: 'clients',
        AttributeDefinitions: [{
            AttributeName: 'email',
            AttributeType: 'S'
        }],
        KeySchema: [{
            AttributeName: 'email',
            KeyType: 'HASH'
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 2
        }
    }, handler);

    docClient.createTable({
        TableName: 'loans',
        AttributeDefinitions: [{
            AttributeName: 'email',
            AttributeType: 'S'
        }, {
            AttributeName: 'loan_id',
            AttributeType: 'N'
        }],
        KeySchema: [{
            AttributeName: 'email',
            KeyType: 'HASH'
        }, {
            AttributeName: 'loan_id',
            KeyType: 'RANGE'
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 2
        }
    }, handler);

}else if(cmd == 'listTables') {

    docClient.listTables({}, handler);

}else if(cmd == 'descTable') {

    docClient.describeTable({
        TableName: tableName
    }, handler);

}else if(cmd == 'seedTable') {

    (function() {
        var recordCount,
            n;

        if(!seedData.exists(tableName)) {
            console.log('Invalid table name');
            return 9;
        }
        
        recordCount = seedData.tableLen(tableName);

        for(n=0; n<recordCount; n++) {

            //insert item
            docClient.putItem({
                TableName: tableName,
                Item: seedData.get(tableName, n),
                ConditionExpression: seedData.getInsertConditionExpression(tableName)  //ensure doesn't already exist. without this, item would be overwritten.
            }, handler);
        }
    })();

}else if(cmd == 'clearTable') {

    //scan for all items in specified table. For each 
    //item, generate the key object and delete the item
    docClient.scan({
        TableName: tableName
    }, function(err, data) {
        if(err) {
            console.log(err, err.stack);
        }else {
            data.Items.forEach(function(item) {
                docClient.deleteItem({
                    TableName: tableName,
                    Key: seedData.getDeleteKeys(tableName, item)
                }, handler);
            });
        }
    });

}else if(cmd == 'getItem') {

    (function() {
        var key = eval('(' + process.argv[4] + ')');

        docClient.getItem({
            TableName: tableName,
            //ConsistentRead: true, //not supported on global secondary indexes.
            Key: key
        }, handler);
    })();

}else if(cmd == 'query') {

    docClient.query({
        TableName: tableName,
        //IndexName: 'my-index',
        //ConsistentRead: true, //not supported on global secondary indexes.
        KeyConditions: [
            docClient.Condition('email', 'EQ', 'asdf@test.com')
        ],
        FilterExpression: '#duration >= :duration and #creditReport.score > :score',
        ExpressionAttributeNames: {
            '#duration'     : 'duration',
            '#creditReport' : 'creditReport'
        },
        ExpressionAttributeValues: {
            ':duration' : 30,
            ':score'    : 700
        }
    }, handler);

}else if(cmd == 'scan') {

    docClient.scan({
        TableName: tableName,
        //IndexName: 'my-index',
        FilterExpression: '#duration >= :duration and #creditReport.score > :score',
        ExpressionAttributeNames: {
            '#duration'     : 'duration',
            '#creditReport' : 'creditReport'
        },
        ExpressionAttributeValues: {
            ':duration' : 30,
            ':score'    : 700
        }
    }, handler);

}else if(cmd == 'update') {

    docClient.updateItem({
        TableName: tableName,
        Key: {
            email: 'asdf@test.com',
            loan_id: 1001
        },
        UpdateExpression: 'set #rate = :rate',
        ExpressionAttributeNames: {
            '#rate': 'rate'
        },
        ExpressionAttributeValues: {
            ':rate': 4.125
        }
    }, handler);

}else if(cmd == 'getAllItems') {
    
    //scan for all items in the specified table
    docClient.scan({
        TableName: tableName
    }, handler);

}else {

    console.log('Invalid command.\n');
    console.log([
        '\nUsage: exec.js [command] [command arguments]\n',
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
