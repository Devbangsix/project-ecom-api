const prisma = require("../config/prisma")
const stripe = require("stripe")('sk_test_51QQc3ZCv7hEP4aSNZRFfiIaQvI3NmmVbAV00LGylmUDe0gkiD4ARuh8FaQdjUkakx2O2c64cEKWfQQWzr1tREGTo00CxZGx0iC');

exports.payment = async (req, res) => {
    try {
        const cart = await prisma.cart.findFirst({
            where:{
                cartById :req.user.id
            }
        })
        const amountTHB = cart.cartTotal * 100
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountTHB,
            currency: "thb",
            // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server Error' })
    }
}