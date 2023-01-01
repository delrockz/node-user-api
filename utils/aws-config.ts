require('dotenv').config()

export const AWS_CONFIG = {
  accessKeyId: process.env.AWSAccessKeyID,
  secretAccessKey: process.env.AWSSecretAccessKey,
  region: 'ap-south-1'
}

export const USER_POOL_ID = process.env.AWS_USER_POOL_ID ?? ''
