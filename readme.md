Node User API

Tech Stack: `Express, Node, Knex JS, Objection JS, AWS Cognito, AWS RDS (Aurora Serverless Postgres DB), AWS SES, AWS SNS, AWS Lambda, AWS IAM, AWS API Gateway, AWS CloudFormation, TypeScript`

1.  Command for deploying the Node User API infrastructure
        
        // This will deploy the initial infrastructure like database and user auth pool
        aws cloudformation deploy --stack-name node-user-api-infrastructure --template-file .\infrastructure.yaml --capabilities CAPABILITY_NAMED_IAM
2.  Get these env variables from AWS CloudFormation stack outputs and set them locally

           RDS_AURORA_POSTGRES_DB_NAME
           RDS_AURORA_POSTGRES_DB_ARN
           RDS_AURORA_POSTGRES_DB_SECRET_ARN
           AWS_USER_POOL_ID
           AWS_USER_POOL_APP_CLIENT_ID
           AWSAccessKeyID
           AWSSecretAccessKey

3.  Run `node .\setup_database_tables.js` to create the required tables in the database

4.  Command for deploying the Node User API serverless lambda/function and API
			
		npm run build	
        sam build
        cp package.json .\.aws-sam\build\NodeUserAPILambda\
        cd .\.aws-sam\build\NodeUserAPILambda\
        npm i
        cd ../../../
        sam deploy --guided
