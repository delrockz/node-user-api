import { SendEmailResponse } from 'aws-sdk/clients/ses'
import { PublishResponse } from 'aws-sdk/clients/sns'
import { AWS_CONFIG } from '../utils/aws-config'
const AWS = require('aws-sdk')

AWS.config.update(AWS_CONFIG)

const senderEmail = 'dxdelrocks@gmail.com'

export const sendEmail = ({
  to,
  subject,
  text,
  message
}: {
  to: string[]
  subject: string
  text: string
  message: string
}) => {
  let emailParams = {
    Destination: {
      ToAddresses: to
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: message
        },
        Text: {
          Charset: 'UTF-8',
          Data: text
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: senderEmail,
    ReplyToAddresses: [senderEmail]
  }

  let sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(emailParams).promise()
  sendPromise
    .then(function (data: SendEmailResponse) {
      console.log('AWS SES MessageID is ' + data.MessageId)
    })
    .catch(function (err: any) {
      console.error(err)
    })
}

export const sendSMS = ({ message, phone }: { message: string; phone: string }) => {
  let smsParams = {
    Message: message,
    PhoneNumber: phone
  }

  let publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(smsParams).promise()
  publishTextPromise
    .then(function (data: PublishResponse) {
      console.log('AWS SNS MessageID is ' + data.MessageId)
    })
    .catch(function (err: any) {
      console.error(err)
    })
}
