require('dotenv').config();

const {
  STSClient,
  GetCallerIdentityCommand,
} = require('@aws-sdk/client-sts');

const client = new STSClient({
  region: process.env.AWS_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testAWS() {
  try {
    const result = await client.send(
      new GetCallerIdentityCommand({})
    );

    console.log('================================');
    console.log('AWS CREDENTIALS ARE VALID');
    console.log('================================');

    console.log({
      Account: result.Account,
      Arn: result.Arn,
      UserId: result.UserId,
    });

  } catch (error) {
    console.log('================================');
    console.log('AWS CREDENTIALS ARE INVALID');
    console.log('================================');

    console.log('Name:', error.name);
    console.log('Message:', error.message);
    console.log('Code:', error.Code);
  }
}

testAWS();