import express from 'express';
import authMiddleware from "../middleware/aouth.js"
import { placeOrder, handleSuccess, handleCancel, userOrders, listOrders, updateOrderStatus } from '../controllers/orderController.js';


const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.get('/success',authMiddleware, handleSuccess);
orderRouter.get('/cancel',authMiddleware, handleCancel);
orderRouter.post("/userorders", authMiddleware, userOrders)
orderRouter.get('/list',listOrders )
orderRouter.post("/status", updateOrderStatus)

export default orderRouter;
