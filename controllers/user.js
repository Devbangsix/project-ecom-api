const prisma = require("../config/prisma")

exports.listUsers = async(req,res) => {
    try{
        const user = await prisma.user.findMany({
            select:{
                id:true,
                email:true,
                role:true,
                enabled:true,
                address:true
            }
        })
        res.json(user)
    }catch(error) {
        console.log(error)
        res.status(500).json({ message:'Server Error' })
    }
}

exports.changeStatus = async(req,res) => {
    try{
        const { id , enabled} = req.body
        console.log(id,enabled)
        const user = await prisma.user.update({
            where:{id: Number(id)},
            data:{ enabled: enabled}
        })
        res.send('Update status success')
    }catch (err) {
        res.status(500).json({ message: "server error" })
    }
}

exports.changeRole = async(req,res) => {
    try{
        const { id , role} = req.body
        console.log(id,role)
        const user = await prisma.user.update({
            where:{id: Number(id)},
            data:{ role: role}
        })
        res.send('Update role success')
    }catch (err) {
        res.status(500).json({ message: "server error" })
    }
}

exports.userCart = async(req,res) => {
    try{
        const { cart } = req.body
        // console.log(cart)
        const user = await prisma.user.findFirst({
            where:{
                id: Number(req.user.id)
            }
        })

        // Check quantity
        for(const item of cart){
            // console.log(item)
            const product = await prisma.product.findUnique({
                where:{id: item.id},
                select:{ quantity:true, title:true}
            })
            if (!product || item.count > product.quantity){
                return res.status(400).json({
                    ok: false,
                    message:`ขอภัย. สินค้า ${product?.title || product} หมด`
                })
            }
            // console.log(product)
        }

        await prisma.productOnCart.deleteMany({
            where:{
                cart:{
                    cartById: user.id
                }
            }
        })
        await prisma.cart.deleteMany({
            where: { cartById: user.id }
        })
        let products = cart.map((item)=>({
            productId: item.id,
            count: item.count,
            price: item.price
        }))
        let cartTotal = products.reduce((sum,item)  =>  sum + item.price * item.count,0)
        const newCart = await prisma.cart.create({
            data:{
                products:{
                    create:products
                },
                cartTotal: cartTotal,
                cartById: user.id
            }
        })
        res.send('ADD ON CART')
    }catch (err) {
        console.log(err)
        res.status(500).json({ message: "server error" })
    }
}

exports.getUserCart = async(req,res) => {
    try{
        const cart = await prisma.cart.findFirst({
            where:{
                cartById: Number(req.user.id)
            },
            include:{
                products:{
                    include:{
                        product:true
                    }
                }
            }
        })
        // console.log(cart)
        res.json({
            products: cart.products,
            cartTotal: cart.cartTotal
        })
    }catch (err) {
        res.status(500).json({ message: "server error" })
    }
}

exports.emptyCart = async(req,res) => {
    try{
        const cart = await prisma.cart.findFirst({
            where: {cartById: Number(req.user.id)}
        })
        if (!cart) {
            return res.status(400).json({message:'No Cart'})
        }
        await prisma.productOnCart.deleteMany({
            where:{ cartId:cart.id }
        })
        const result = await prisma.cart.deleteMany({
            where:{
                cartById: Number(req.user.id)
            }
        })
        console.log(result)
        res.json({
            message:'Cart Empty Success',
            deleteCount: result.count
        })
    }catch (err) {
        console.log(err)
        res.status(500).json({ message: "server error" })
    }
}

exports.saveAddress = async(req,res) => {
    try{
        const address = req.body
        console.log(address)
        const addressUesr = prisma.user.update({
            where:{
                id: Number(req.user.id)
            },
            data:{
                address: address
            }
        })
        // console.log(addressUesr)
        res.json({ok: true , message:'Update Address Success'})
    }catch (err) {
        console.log(err)
        res.status(500).json({ message: "server error" })
    }
}

exports.saveOrder = async(req,res) => {
    try{ 
        // stripePaymentId String
        // amount Int
        // status String
        // currency String
        const  { id, amount, status, currency } = req.body.paymentIntent 
        // console.log(req.body)
        // return res.send('hello jukkru')

        const userCart = await prisma.cart.findFirst({
            where:{ 
                cartById : Number(req.user.id)
            },
            include: {
                products: true
            }
        })
        // Check Cart empty
        if (!userCart ||userCart.products.length === 0){
            return res.status(400).json({ ok: false , message: 'not cart'})
        }
        
        const amountTHB = Number(amount) / 100
        // Create a New Oerder
        const order = await prisma.order.create({
            data:{
                products:{
                    create: userCart.products.map((item) => ({
                        productId: item.productId,
                        count: item.count,
                        price: item.price
                    }))
                },
                orderBy:{
                    connect:{ id: req.user.id}
                },
                cartTotal: userCart.cartTotal,
                stripePaymentId: id,
                amount: amountTHB,
                status: status,
                currency: currency,
                
            }
        })

        // stripePaymentId String
        // amount Int
        // status String
        // currency String
        // Update Product
        const update  = userCart.products.map((item) =>({
            where:{ id: req.user.id},
            data:{
                quantity: {decrement: item.count},
                sold: {increment: item.count}
            }
        })) 

        // console.log(update)
        await Promise.all(
            update.map((updated) => prisma.product.update(updated))
        )
        await prisma.cart.deleteMany({
            where:{ cartById: Number( req.user.id )}
        })
        // console.log(userCart)
        res.json({ok:true , order})
    }catch (err) {
        console.log(err)
        res.status(500).json({ message: "server error" })
    }
}

exports.getOrder = async(req,res) => {
    try{
        const orders = await prisma.order.findMany({
            where:{orderById: Number(req.user.id)},
            include:{
                products:{
                   include:{
                    product: true
                   }
                }
            }
        })
        if(orders.length === 0) {
            return res.status(400).json({ok: false, message:'Not order'})
        }
        console.log(orders)
        res.json({ok:true, orders})
    }catch (err) {
        res.status(500).json({ message: "server error" })
    }
}