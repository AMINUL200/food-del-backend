import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Paypal from 'paypal-rest-sdk';

// Configure PayPal
Paypal.configure({
    mode: 'sandbox', // or 'live'
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_SECRET_KEY
});

// Function to get the current exchange rate from INR to USD
const getExchangeRate = async () => {
    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/INR');
        return response.data.rates.USD;
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        throw error;
    }
};

// Place user order for frontend
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;

        // Get the exchange rate
        const exchangeRate = await getExchangeRate();
        const amountInUSD = (amount / exchangeRate).toFixed(2); // Convert INR to USD

        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address,
            date: Date.now()
        });
        await newOrder.save();
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Calculate item prices in USD and ensure precision
        const itemList = items.map(item => ({
            name: item.name,
            sku: item.id,
            price: (item.price / exchangeRate).toFixed(2), // Convert INR to USD
            currency: 'USD',
            quantity: item.quantity
        }));

        // Calculate total amount of items in USD
        const totalItemsAmountUSD = itemList.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0).toFixed(2);

        // Prepare PayPal payment
        const create_payment_json = {
            intent: "sale",
            payer: {
                payment_method: "paypal"
            },
            redirect_urls: {
                 return_url: "https://food-del-frontend-z3s5.onrender.com/api/order/success",
                cancel_url: "https://food-del-frontend-z3s5.onrender.com/api/order/cancel"
            },
            transactions: [{
                item_list: {
                    items: itemList
                },
                amount: {
                    currency: 'USD',
                    total: totalItemsAmountUSD // This should match the calculated total amount
                },
                description: "Your order description"
            }]
        };

        Paypal.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                console.log("PayPal Payment Creation Error:", error.response ? error.response : error);
                res.status(500).send(error);
            } else {
                let approval_url;
                for (let link of payment.links) {
                    if (link.rel === 'approval_url') {
                        approval_url = link.href;
                        break;
                    }
                }
                if (approval_url) {
                    res.json({ success: true, approval_url });
                } else {
                    res.status(500).json({ success: false, message: "No approval_url found in PayPal response" });
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Order creation failed", error: err });
    }
};



// Handle PayPal success callback
const handleSuccess = async (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        payer_id: payerId,
        transactions: [{
            amount: {
                currency: 'USD',
                total: req.query.amount // You might want to handle amount securely
            }
        }]
    };

    Paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            console.log(error.response);
            res.status(500).send(error);
        } else {
            res.send("Payment Successful");
        }
    });
};

// Handle PayPal cancel callback
const handleCancel = (req, res) => {
    res.send("Payment cancelled");
};

// user orders for frontend :
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel
            .find({ userId: req.body.userId })
            .sort({ date: -1 }); // Sort orders by `date` field in descending order
        res.json({ success: true, data: orders });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Cannot find orders" });
    }
}

// listing orders for admin panel:
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}); // Fetch all orders
        res.json({ success: true, data: orders });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Cannot fetch orders" });
    }
}

// api for updating order status :

const updateOrderStatus = async (req, res) => {
    try {
        const updatedOrder = await orderModel.findByIdAndUpdate(req.body.orderId, {status: req.body.status});
        res.json({ success: true, data: updatedOrder });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Cannot update order status" });
    }
}

export { placeOrder, handleSuccess, handleCancel, userOrders , listOrders, updateOrderStatus};
