import { Model } from 'objection'
require('dotenv').config()

const knexDataApiClient = require('knex-aurora-data-api-client')
const knex = require('knex')({
  client: knexDataApiClient.postgres,
  connection: {
    secretArn: process.env.RDS_AURORA_POSTGRES_DB_SECRET_ARN || '',
    resourceArn: process.env.RDS_AURORA_POSTGRES_DB_ARN || '',
    database: process.env.RDS_AURORA_POSTGRES_DB_NAME || '',
    region: 'ap-south-1'
  }
})

class User extends Model {
  first_name!: string
  last_name!: string
  email!: string
  phone!: string
  static tableName = 'users'
}

User.knex(knex)

export default User
