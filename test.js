var AWS = require('aws-sdk'),
    ddb;

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
ddb = new AWS.DynamoDB();

ddb.listTables({}, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});
