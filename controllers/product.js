const prisma = require("../config/prisma")
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.create = async (req, res) => {
    try {
        const { title, description, price, categoryId, quantity, images } = req.body
        console.log(title, description, price, quantity, images)
        const product = await prisma.product.create({
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {
                    create: images.map((item) => ({
                        asset_id: item.asset_id,
                        public_id: item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }

            }
        })
        // console.log(product)
        // res.json('hello create product')
        res.send(product)
    } catch (error) {
        console.log('category error', error)
        res.status(500).json({ message: "Server error" })
    }
}

exports.list = async (req, res) => {
    try {
        const { count } = req.params
        const products = await prisma.product.findMany({
            take: parseInt(count),
            orderBy: { createdAt: "desc" },
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (error) {
        console.log('category error', error)
        res.status(500).json({ message: "Server error" })
    }
}

exports.read = async (req, res) => {
    try {
        const { id } = req.params
        const products = await prisma.product.findFirst({
            where: {
                id: Number(id)
            },
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (error) {
        console.log('category error', error)
        res.status(500).json({ message: "Server error" })
    }
}

exports.update = async (req, res) => {
    try {
        const { title, description, price, categoryId, quantity, images } = req.body

        await prisma.image.deleteMany({
            where: {
                productId: Number(req.params.id)
            }
        })

        const product = await prisma.product.update({
            where: {
                id: Number(req.params.id)
            },
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {
                    create: images.map((item) => ({
                        asset_id: item.asset_id,
                        public_id: item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }

            }
        })
        res.send('Update Success')
    } catch (error) {
        console.log('category error', error)
        res.status(500).json({ message: "Server error" })
    }
}

exports.remove = async (req, res) => {
    try {
        const { id } = req.params

        const product = await prisma.product.findFirst({
            where:{ id: Number(id) },
            include:{ images: true }
        }) 
        if (!product) {
            return res.status(400).json({ message: 'Product not found!!'})
        }
        // console.log(product)

        const deleteImage = product.images.map((image) =>
            new Promise((resolve,reject) => {
                cloudinary.uploader.destroy(image.public_id,(err,result) => {
                    if (err) reject(err)
                    else resolve(result)
                })
            })
        )
        await Promise.all(deleteImage)
        
        await prisma.product.delete({
            where: {
                id: Number(id)
            }
        })
        res.send('Deleted Success')
    } catch (error) {
        console.log('category error', error)
        res.status(500).json({ message: "Server error" })
    }
}

exports.listby = async (req, res) => {
    try {
        const { sort, order, limit } = req.body
        // console.log( sort, order, limit ) 
        const products = await prisma.product.findMany({
            take: limit,
            orderBy: { [sort]: order },
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (error) {
        console.log('category error', error)
        res.status(500).json({ message: "Server error" })
    }
}

const handleQuery = async (req, res, query) => {
    try {
        const product = await prisma.product.findMany({
            where: {
                title: {
                    contains: query,
                }
            },
            include: {
                category: true,
                images: true
            }
        })
        res.send(product)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Search Error" })
    }
}

const handPrice = async (req, res, priceRange) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                price: {
                    gte: priceRange[0],
                    lte: priceRange[1]
                }
            },
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}

const handCategory = async (req, res, categoryId) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                categoryId: {
                    in: categoryId.map((id) => Number(id))
                }
            },
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}


exports.searchFilters = async (req, res) => {
    try {
        const { query, price, category } = req.body
        if (query) {
            console.log('query', query)
            await handleQuery(req, res, query)
        }
        if (category) {
            console.log('category', category)
            await handCategory(req, res, category)
        }
        if (price) {
            console.log('price', price)
            await handPrice(req, res, price)
        }

    } catch (error) {
        console.log('category error', error)
        res.status(500).json({ message: "Server error" })
    }
}


exports.createImage = async (req, res) => {
    try {
        // console.log(req.body)
        const result = await cloudinary.uploader.upload(req.body.image, {
            public_id: `Ping-${Date.now()}`,
            resource_type: 'auto',
            folder: 'Ecom'
        })
        res.send(result)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server err" })
    }
}

exports.removeImage = async (req, res) => {
    try {
        const { public_id } = req.body
        // console.log(public_id)
        cloudinary.uploader.destroy(public_id,(result) =>{
            res.send('Remove Image Succsee')
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server err" })
    }
}