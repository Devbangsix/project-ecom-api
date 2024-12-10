const express  = require('express')
const router = express.Router()
const { create,list,read,remove,listby,searchFilters, update, createImage,removeImage} = require('../controllers/product')
const { adminCheck, authCheck } = require('../middlewares/authCheck')
router.post('/product',create)
router.get('/products/:count',list)
router.get('/product/:id',read)
router.put('/product/:id',update)
router.delete('/product/:id',remove)
router.post('/productby',listby)
router.post('/search/filters',searchFilters)


router.post('/images',authCheck,adminCheck,createImage)
router.post('/removeimage',authCheck,adminCheck, removeImage)


module.exports = router