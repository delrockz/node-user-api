import { Request } from 'express'
import { IUser } from './IUser'

export interface IRequestWithUser extends Request {
  user: IUser
}
