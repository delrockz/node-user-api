const knexDataApiClient = require('knex-aurora-data-api-client')
require('dotenv').config()

const knex = require('knex')({
  client: knexDataApiClient.postgres,
  connection: {
    secretArn: process.env.RDS_AURORA_POSTGRES_DB_SECRET_ARN || '',
    resourceArn: process.env.RDS_AURORA_POSTGRES_DB_ARN || '',
    database: process.env.RDS_AURORA_POSTGRES_DB_NAME || '',
    region: 'ap-south-1'
  }
})

const usersTableName = 'users'

const createUsersTableIfNotExists = async () => {
  const usersTableExists = await knex.schema.hasTable(usersTableName)
  if (!usersTableExists)
    await knex.schema.createTable(usersTableName, (table) => {
      table.increments()
      table.text('first_name')
      table.text('last_name')
      table.text('email')
      table.text('phone')
    })
}

createUsersTableIfNotExists()
