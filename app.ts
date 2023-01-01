import apiRoutes from './routes'
const cors = require('cors')

const express = require('express')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const app = express()
app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ credentials: true }))
app.use('/api', apiRoutes)

const port = process.env.PORT || 5000
app.listen(port)
