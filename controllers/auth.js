const prisma = require('../config/prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { token } = require('morgan')

exports.register = async(req,res) => {
    try {
        const { email, password } = req.body
        if (!email ){
            return res.status(400).json({ message:'Not email' })
        }
        if (!password){
            return res.status(400).json({ message:'Not password'})
        }
        const user = await prisma.user.findFirst({
            where:{
                email: email
            }
        })
        if (user){
            return res.status(400).json({message : 'Email already exits'})
        }
        
        const hashPassword = await bcrypt.hash(password,10)

        await prisma.user.create({
            data:{
                email: email,
                password: hashPassword
            }
        })

        res.send('Register success')
    }catch(error){
        console.log('register error',error)
    }
}

exports.login = async(req,res) => {
    try {
        const { email, password} = req.body
        console.log(email,password)
        // Step 1 Check email
        const user = await prisma.user.findFirst({
            where:{
                email: email
            }
        })
        if (!user || !user.enabled){
            return res.status(400).json({
                message : 'User Not foun not Enabled'
            })
        }
        // Step 2 Check password 
        const isMatch = await bcrypt.compare(password,user.password)
        if (!isMatch) {
            return res.status(500).json({
                message : 'Password Invalid!!!'
            })
        }
        // Step 3 Create Payload
        const Payload = {
            id: user.id,
            email: user.email,
            role: user.role
        }
        console.log(Payload)
        // Step 4 Generate Token 
        jwt.sign(Payload,process.env.SECRET,{
            expiresIn: '1d'
        },(err,token) => {
            if (err) {
                return res.status(500).json({
                    message:"server error"
                })   
            } res.json({Payload,token})
        })
    }catch (error) {
        console.log('login error',error) 
    }
}

exports.currentUser = async(req,res) => {
    try {
        const user = await prisma.user.findFirst({
            where:{
                email: req.user.email
            },
            select:{
                id: true,
                email: true,
                name: true,
                role:true
            }
        })
        // console.log(user)
        res.send({user})
    }catch(error){
        console.log('User error',error)
    }
}
