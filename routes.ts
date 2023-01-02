import {
  confirmUserWithOTP,
  deleteUser,
  getUserProfile,
  loginUser,
  signupUser,
  updateUserProfile
} from './controllers/UserController'
import { authenticate } from './middlewares/auth'

const express = require('express')
const router = express.Router()

// User APIs
router.post('/signup', signupUser)
router.put('/verify-otp', confirmUserWithOTP)
router.post('/login', loginUser)
router.get('/user', authenticate, getUserProfile)
router.put('/user', authenticate, updateUserProfile)
router.delete('/user/:phone', deleteUser)

export default router
