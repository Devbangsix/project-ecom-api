const express = require('express')
const app = express()
const morgan = require('morgan')
const { readdirSync } = require('fs')
const cors = require('cors')
// const auth = require('./routes/auth')
// const Category = require('./routes/category')


app.use(morgan('dev'))
app.use(express.json({limit:'20mb'}))
app.use(cors())

readdirSync('./routes').map(( P ) => app.use('/Ping-eco',require('./routes/' + P )))
// app.use('/Ping-eco',auth)
// app.use('/Ping-eco',Category)

// app.post('/test',(req,res) => {
//     const {email,username,password} = req.body
//     console.log(email,username,password)
//     res.send('hello world')
// })


app.listen(5000,()=>console.log('Start hi'))