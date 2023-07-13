import shopUserModel from "../Models/shopUser.js";
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import productModel from '../Models/product.js'

class ShopUserController{
    static getUser = async(req,res)=>{
        res.send("Get User Works");
    }


    static getProducts = async(req,res)=>{
        try {
            let params = req.query;
            const { limit, page, sortBy, name } = req.query;
            let countTotalResult = await productModel.find();

            let current = new Date().toISOString();

            for(let product of countTotalResult){
                if(product.deal){
                    if(current>product.deal.ends){
                        await productModel.findByIdAndUpdate(product._id,{
                            $unset:{
                                deal:1
                            }
                        },{new:true})
                    }
                }
            }

            countTotalResult = await productModel.find();

            let resResult = countTotalResult.length;
            //console.log(countTotalResult,"Working");
            let u = await this.getUsersByQuery(req.query);
            //console.log(resResult,"From U")
      
            if(u.length==undefined){
              //console.log(u.length)
              throw Error("Invalid Page Number");
            }
      
            let countLimit = 10;
            let countPage = 1;
      
            if (limit) {
              countLimit = limit;
            }
      
            if (page) {
              countPage = page;
            }

            if(name){
                try{
                    let product = await productModel.find({name:name});
                    return res.send({
                        results: product,
                        page: 1,
                        limit: 10,
                        totalPages: 1,
                        totalResults: 1,
                      })
                }
                catch(err){
                    return res.send({
                        results: [],
                        page: 1,
                        limit: 10,
                        totalPages: 1,
                        totalResults: 1,
                      })
                }
                
            }
      
            let totalPages = Math.ceil(resResult/ countLimit);
            if (totalPages == 0) {
              totalPages = 1;
            }
      
            let countrole = 0;
      
            let obj = {
              results: u,
              page: countPage,
              limit: countLimit,
              totalPages: totalPages,
              totalResults: resResult,
            };
            // console.log(users);
            res.send(obj);
          } catch (err) {
            //console.log(err)
              return res.send({
                  results: [],
                  page: 0,
                  limit: 0,
                  totalPages: 0,
                  totalResults: 0,
                })
          }
        };
      
        static getUsersByQuery = async (filterParams, id) => {
          try {
            let query = productModel.find();
            if (filterParams.name) {
              query = query.where("name").equals(filterParams.name);
            }
      
            if (filterParams.sortBy) {
              query = query.sort(filterParams.sortBy);
            }
      
            let limit = 10; // Default limit to 10 if not provided
            if (filterParams.limit) {
              limit = parseInt(filterParams.limit);
            }
            query = query.limit(limit);
      
            let page = 1; // Default page to 1 if not provided
            if (filterParams.page) {
              page = parseInt(filterParams.page);
            }
      
            const countQuery = productModel.find().countDocuments();
            let totalUsers = await countQuery.exec();
            //console.log(totalUsers,"From TotalUsers")
      
          
            // Calculate the total number of pages based on the filtered results
            const totalPages = Math.ceil(totalUsers / limit);
            //console.log(totalPages,"From totalPages");
      
            if (page > totalPages) {
             return new Error("Invalid Page Number");
              //console.log("Invalid page number. No data available.");
            }
            const skip = (page - 1) * limit;
            query = query.skip(skip);
      
            const products = await query.exec();
            //console.log(products,"From Products")
            return products;
          } catch (error) {
            //console.error("Error getting Products:", error);
          }
        };
      


    static updateCustomerProfile = async(req,res)=>{
        const {name,email} = req.body;
        if(name=="" || name==undefined || name==null){
            return res.send({
                code: 400,
                message: "Name Is Requires",
                stack: "Error: Please Provide Valid Name",
              })
        }
        else if(email=="" || email==undefined || email==null){
            return res.send({
                code: 400,
                message: "Email Is Requires",
                stack: "Error: Please Provide Valid email",
              })
        }
        else{
            try{

                //console.log(req.shopUser);
                let shopUser = await shopUserModel.findByIdAndUpdate(req.shopUser._id,{
                    $set:{
                        email:email,
                        name:name
                    }
                })

                return res.send("Profile Updated Successfully")
    
            }catch(err){
                return res.send({
                    code: 400,
                    message: "Please Authenticate",
                    stack: "Error: Please Authenticate",
                })
            }
        }
    };

    static updateCustomerProfilePicture = async (req,res)=>{
        try{
            //console.log("Api Gets Hit")
            res.set('Content-Type', 'image/jpeg');
            const profilePicture = req.file;
            //console.log(req.file)
            let user = await shopUserModel.findByIdAndUpdate(req.shopUser._id,{
                $set:{
                    picture:profilePicture.path
                }
            });
            return res.send({message:"Profile Picture Updated Successfully"});
        }catch(err){
            //console.log(err);
            return res.send({
                code: 400,
                message: "Please Authenticate",
                stack: "Error: Please Authenticate",
            })
        }
        //return res.send(profilePicture)
    };

    static getProfilePicture =  async (req, res) => {
        try {

        let {userId} = req.params;
          // Find the product that contains the requested image

          const user = await shopUserModel.findById(userId);

          //console.log(user)
    
          if (!user) {
            return res.status(404).json({ error: 'Image not found' });
          }

          res.set('Content-Type', 'image/jpeg');

          const picturePath = user.picture;
          res.sendFile(path.resolve(picturePath));
       
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Failed to retrieve image' });
        }
      };

      static removeProfilePicture =  async (req, res) => {
        try {
          // Find the product that contains the requested image
          const user = await shopUserModel.findById(req.shopUser._id);
          //console.log(user)
    
          if (!user) {
            return res.status(404).json({ error: 'Image not found' });
          }

         await shopUserModel.findByIdAndUpdate(user._id,{
            $set:{
                picture:"Profile-Picture-Images/28ad22b01fb87e34f1fdf4014e2a0e3c"
            }
         })

         return res.send("Profile Image Deleted Successfully");
       
        } catch (error) {
          console.error(error);
         return res.status(500).json({ error: 'Failed to retrieve image' });
        }
      };

      static getSavedAddresses = async(req,res)=>{
            try{
                return res.send(req.shopUser.addresses);
            }catch(err){
                return res.status(400).send({message:"Error Occurred"})
            }
      }


      static addNewAddress = async(req,res)=>{

        let { street, addressLine2 ,city ,state ,pin} = req.body;
        if(street=="" || street==undefined || street==null){
            return res.status(400).send({
                code: 400,
                message: "Street is required",
                stack: "Error: Please Provide Street value",
            })
        }
        else if(addressLine2=="" || addressLine2==undefined || addressLine2==null){
            return res.status(400).send({
                code: 400,
                message: "Address Line2 is required",
                stack: "Error: Please Provide Address Line2 value",
            })
        }
        else if(city=="" || city==undefined || city==null){
            return res.status(400).send({
                code: 400,
                message: "City is required",
                stack: "Error: Please Provide City value",
            })
        }
        else if(state=="" || state==undefined || state==null){
            return res.status(400).send({
                code: 400,
                message: "State is required",
                stack: "Error: Please Provide State value",
            })
        }
        else if(pin=="" || pin==undefined || pin==null){
            return res.status(400).send({
                code: 400,
                message: "Pin is required",
                stack: "Error: Please Provide Valid pin",
            })
        }
        else{
            try{

                var newId = new mongoose.Types.ObjectId();

                let obj = {
                    _id:newId,
                    street: street, 
                    addressLine2: addressLine2, 
                    city: city, 
                    state: state, 
                    pin: pin
                }
                let user = await shopUserModel.findById(req.shopUser._id);
                let add = user.addresses;
                add.push(obj);
                await shopUserModel.findByIdAndUpdate(user._id,{
                    $set:{
                        addresses:add
                    }
                })
                return res.send(add);
                
            }catch(err){
                console.log(err)
                return res.status(400).send({
                    code: 400,
                    message: "Unable To Add Address",
                    stack: "Error: Plaese check Token",
                })
            }
        }

      }

      static updateAddress = async(req,res)=>{
        let { street, addressLine2 ,city ,state ,pin} = req.body;
        if(street=="" || street==undefined || street==null){
            return res.status(400).send({
                code: 400,
                message: "Street is required",
                stack: "Error: Please Provide Street value",
            })
        }
        else if(addressLine2=="" || addressLine2==undefined || addressLine2==null){
            return res.status(400).send({
                code: 400,
                message: "Address Line2 is required",
                stack: "Error: Please Provide Address Line2 value",
            })
        }
        else if(city=="" || city==undefined || city==null){
            return res.status(400).send({
                code: 400,
                message: "City is required",
                stack: "Error: Please Provide City value",
            })
        }
        else if(state=="" || state==undefined || state==null){
            return res.status(400).send({
                code: 400,
                message: "State is required",
                stack: "Error: Please Provide State value",
            })
        }
        else if(pin=="" || pin==undefined || pin==null){
            return res.status(400).send({
                code: 400,
                message: "Pin is required",
                stack: "Error: Please Provide Valid pin",
            })
        }
        else{
            try{
                let add = req.shopUser.addresses;
                let newArr = [];
                for(let item of add){
                    if(item._id==req.params.addressId){
                        let obj = {
                            _id:item._id,
                            street: street, 
                            addressLine2: addressLine2, 
                            city: city, 
                            state: state, 
                            pin: pin
                        }
                        newArr.push(obj)
                    }
                    else{
                        newArr.push(item);
                    }
                }

                let user = await shopUserModel.findByIdAndUpdate(req.shopUser._id,{
                    $set:{
                        addresses:newArr
                    }
                });
                return res.send("address Updated Successfully");
                
            }catch(err){
                console.log(err)
                return res.status(400).send({
                    code: 400,
                    message: "Please Provide Valid Mongodb Id",
                    stack: "Error: Please Provide Valid Mongodb Id",
                })
            }
        }
      };


      static deleteAddress = async(req,res)=>{

        try{
            let add = req.shopUser.addresses;
            let newArr = [];
            for(let item of add){
                if(item._id!=req.params.addressId){
                    newArr.push(item);
                }
            }

            let user = await shopUserModel.findByIdAndUpdate(req.shopUser._id,{
                $set:{
                    addresses:newArr
                }
            });
            return res.send({message:"address Deleted Successfully"});
            
        }catch(err){
            console.log(err)
            return res.status(400).send({
                code: 400,
                message: "Please Provide Valid Mongodb Id",
                stack: "Error: Please Provide Valid Mongodb Id",
            })
        }
      }

      static changePassword = async(req,res)=>{
      const { old_password, new_password } = req.body;

        if(old_password=="" || old_password==undefined || old_password==null){
            return res.status(400).send({
                code: 400,
                message: "Old Password is required",
                stack: "Error: Please Provide Password",
            })
        }
        else if(new_password=="" || new_password==undefined || new_password==null){
            return res.status(400).send({
                code: 400,
                message: "Password is required",
                stack: "Error: Please Provide New Password",
            })
        }
        else{
            try{
                let shopUser = await shopUserModel.findById(req.shopUser._id);
                const isMatch = await bcrypt.compare(old_password, shopUser.password);
                if(isMatch){
                    let salt = await bcrypt.genSalt(10);
                    let newHashPassword = await bcrypt.hash(new_password,salt);
        
                    await shopUserModel.findByIdAndUpdate(req.shopUser._id,{
                        $set:{
                            password:newHashPassword
                        }
                    })
                    return res.send({message:"Password Changed Successfully"});
                }
                else{
                    return res.status(400).send({
                        code: 400,
                        message: "Old Password Does Not Match",
                        stack: "Error: Please Enter Corrrect Old Password",
                    })
                }

            }catch(err){
                console.log(err)
                return res.status(400).send({
                    code: 400,
                    message: "Please Authenticate",
                    stack: "Error: Please Authenticate",
                })
            }
        }
      }

      static deleteAccount = async(req,res)=>{
        try{
            await shopUserModel.findByIdAndUpdate(req.shopUser._id,{
                $set:{
                    deleted:true
                }
            });
            return res.send({message:"Account Deleted successfully"});
        }catch(err){
            console.log(err);
            return res.send({
                code: 400,
                message: "Please Authenticate",
                stack: "Error: Please Authenticate",
            })
        }
        return res.send("Delete Account")
      };

      static getProductDetails = async(req,res)=>{
        try{
            let {productId} = req.params;
            let product  = await productModel.findById(productId).select('-sellerId');
            const current = new Date().toISOString();
                if(product.deal){
                    if(current>product.deal.ends){
                        await productModel.findByIdAndUpdate(product._id,{
                            $unset:{
                                deal:1
                            }
                        },{new:true})
                    }
                }
            product  = await productModel.findById(productId).select('-sellerId');
            return res.send(product)
        }
        catch(err){
            console.log(err);
            return res.status(400).send({message:"Error Occurred"})
        }
      }
}

export default ShopUserController;