import { Request, Response } from 'express'
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUserSession
} from 'amazon-cognito-identity-js'
import { generateOTP } from '../utils'
import User from '../models/User'
import { sendEmail, sendSMS } from '../services'
import { AWS_CONFIG, USER_POOL_ID } from '../utils/aws-config'
import { IRequestWithUser } from '../interfaces/IRequestWithUser'
import {
  AdminConfirmSignUpResponse,
  AdminGetUserResponse,
  AdminUpdateUserAttributesResponse,
  AttributeType
} from 'aws-sdk/clients/cognitoidentityserviceprovider'
import AWS from 'aws-sdk'

AWS.config.update(AWS_CONFIG)
var cognitoAdminClient = new AWS.CognitoIdentityServiceProvider({
  apiVersion: '2016-04-19'
})

var userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: process.env.AWS_USER_POOL_APP_CLIENT_ID ?? ''
})

const UPDATABLE_USER_FIELDS = ['first_name', 'last_name']

export const signupUser = async (req: Request, res: Response, next: () => void) => {
  const {
    email,
    first_name,
    last_name,
    phone,
    password
  }: { email: string; first_name: string; last_name: string; phone: string; password: string } = req.body

  if (!email || !phone || !first_name || !last_name) return res.status(400).json({ error: 'Missing required fields' })

  let otp = generateOTP()
  userPool.signUp(
    phone,
    password,
    [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'custom:first_name', Value: first_name }),
      new CognitoUserAttribute({ Name: 'custom:last_name', Value: last_name }),
      new CognitoUserAttribute({ Name: 'custom:otp', Value: otp }) // To verify the OTP later
    ],
    [],
    async (err, result) => {
      if (err) return res.status(500).json({ error: err.message || JSON.stringify(err) })
      try {
        // Create user in db
        await User.query().insert({
          email,
          first_name,
          last_name,
          phone
        })

        let message = `Your verification code is ${otp}`
        // Send confirmation email
        sendEmail({
          to: [email],
          message,
          text: message,
          subject: message
        })
        // Send confirmation SMS
        sendSMS({ message, phone })
        return res
          .status(200)
          .json({ data: `Signed up successfully, verification code sent on ${email} and ${phone}.` })
      } catch (err: any) {
        return res.status(500).json({ error: err.message })
      }
    }
  )
}

export const confirmUserWithOTP = async (req: Request, res: Response, next: () => void) => {
  const { code, phone }: { code: string; phone: string } = req.body
  if (!code) return res.status(400).json({ error: `'code' is required.` })
  if (!phone) return res.status(400).json({ error: `'phone' is required.` })
  let Username = phone
  cognitoAdminClient.adminGetUser({ Username, UserPoolId: USER_POOL_ID }, (err: any, result: AdminGetUserResponse) => {
    if (err) return res.status(500).json({ error: err.message || JSON.stringify(err) })
    let validOTP = result.UserAttributes?.find((obj: AttributeType) => obj.Name === 'custom:otp')?.Value
    if (code !== validOTP) return res.status(403).json({ error: 'Invalid OTP.' })
    cognitoAdminClient.adminConfirmSignUp(
      {
        Username,
        UserPoolId: USER_POOL_ID
      },
      (err: any, result: AdminConfirmSignUpResponse) => {
        if (err) return res.status(500).json({ error: err.message || JSON.stringify(err) })
        cognitoAdminClient.adminUpdateUserAttributes(
          {
            UserAttributes: [
              {
                Name: 'phone_number_verified',
                Value: 'true'
              },
              {
                Name: 'email_verified',
                Value: 'true'
              }
            ],
            UserPoolId: USER_POOL_ID,
            Username
          },
          (err: any, result: AdminUpdateUserAttributesResponse) => {
            if (err) return res.status(500).json({ error: err.message || JSON.stringify(err) })
            return res.status(200).json({ message: 'Successfully confirmed user' })
          }
        )
      }
    )
  })
}

export const loginUser = async (req: Request, res: Response, next: () => void) => {
  try {
    const { phone, password }: { phone: string; password: string } = req.body
    if (!phone) return res.status(400).json({ error: "'phone' required." })
    if (!password) return res.status(400).json({ error: "'password' required." })

    let Username = phone
    var cognitoUser = new CognitoUser({
      Username,
      Pool: userPool
    })
    cognitoUser.authenticateUser(
      new AuthenticationDetails({
        Username,
        Password: password
      }),
      {
        onSuccess(session: CognitoUserSession) {
          return res.status(200).json({
            data: {
              accessToken: session.getAccessToken().getJwtToken(),
              refreshToken: session.getRefreshToken().getToken(),
              idToken: session.getIdToken().getJwtToken()
            }
          })
        },
        onFailure(err) {
          if (err) return res.status(403).json({ error: err.message || JSON.stringify(err) })
        }
      }
    )
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export const getUserProfile = async (req: IRequestWithUser, res: Response, next: () => void) => {
  if (req.user) return res.status(200).json({ data: req.user })
  return res.status(403).json({ error: 'Unauthorized' })
}

export const updateUserProfile = async (req: IRequestWithUser, res: Response, next: () => void) => {
  try {
    const updates = req.body
    if (!Object.keys(updates || {}).length) return res.status(400).json({ error: 'No field to update.' })
    if (Object.keys(updates).some((userField) => !UPDATABLE_USER_FIELDS.includes(userField)))
      return res
        .status(400)
        .json({ error: `Invalid field to update, only fields: ${UPDATABLE_USER_FIELDS.join(', ')} can be updated.` })

    await User.query()
      .update({ ...updates })
      .where({
        email: req.user.email
      })
    return res.status(200).json({ data: 'Successfully updated user profile.' })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export const deleteUser = async (req: Request, res: Response, next: () => void) => {
  try {
    let phone = req.params.phone
    if (!phone) return res.status(400).json({ error: "Missing required field 'phone'." })
    cognitoAdminClient.adminDeleteUser(
      {
        Username: phone,
        UserPoolId: USER_POOL_ID
      },
      async (err: any) => {
        if (err) return res.status(403).json({ error: err.message || JSON.stringify(err) })
        await User.query().delete().where({ phone })
        return res.status(200).json({ data: 'Deleted user account successfully.' })
      }
    )
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
