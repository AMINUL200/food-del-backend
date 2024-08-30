import userModel from "../models/userModel.js"


// Add items to user carts
const addToCart = async (req, res) => {
    try{
        let userData = await userModel.findById({_id:req.body.userId});
        let cartData = await userData.cartData
        if(!cartData[req.body.itemId]){
            cartData[req.body.itemId] = 1
        }else{
            cartData[req.body.itemId] += 1
        }

        await userModel.findByIdAndUpdate(req.body.userId, { cartData: cartData })
        res.json({success: true, message:"item added to cart"})
    }catch(err){
        console.log(err);
        res.json({success: false, message:"item not added to cart"})
    }
    
}

// remove items from user carts
const removeFromCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        let cartData = await userData.cartData
        if(cartData[req.body.itemId] > 0){
            cartData[req.body.itemId] -= 1
        }
        await userModel.findByIdAndUpdate(req.body.userId, {cartData: cartData})
        res.json({success: true, message: 'Cart deleted successfully'})
    }catch(err){
        console.log(err);
        res.json({success: false, message:"Cart not Deleted successfully"})
    }
}

//fetch user cart Data
const getCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        let cartData = await userData.cartData;
        res.json({success: true, cartData})
    }catch(err){
        console.log(err);
        res.json({success: false, message:"Can not get user cart Data"})
    }
}

export { addToCart, removeFromCart,getCart}