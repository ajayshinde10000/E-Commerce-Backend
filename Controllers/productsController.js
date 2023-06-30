import multer  from 'multer';
const upload = multer({ dest: 'Product-Images/' })
import productsModel from '../Models/product.js';
import fs from 'fs';
import path from 'path';

class ProductsController{

    static getProducts = async(req,res)=>{

        try {
            let params = req.query;
            const { limit, page, sortBy, name } = req.query;
      
            let countTotalResult = await productsModel.find({
              "_org._id": req.seller._org._id,
            });
      
            let resResult = countTotalResult.length;
            //console.log(countTotalResult,"Working");
            let u = await this.getUsersByQuery(req.query, req.seller._org._id);
      
            if(u.length==undefined){
              console.log(u.length)
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
                    let product = await productsModel.find({name:name});
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
      
            let totalPages = Math.ceil(u.length / countLimit);
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
            let query = productsModel.find({ "_org._id": id });
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
      
            const countQuery = productsModel.find({ "_org._id": id}).countDocuments();
            let totalUsers = await countQuery.exec();
      
          
            // Calculate the total number of pages based on the filtered results
            const totalPages = Math.ceil(totalUsers / limit);
            console.log(totalUsers,"From Limit");
      
            if (page > totalPages) {
             return new Error("Invalid Page Number");
              //console.log("Invalid page number. No data available.");
            }
            const skip = (page - 1) * limit;
            query = query.skip(skip);
      
            const products = await query.exec();
            console.log(products,"From Products")
            return products;
          } catch (error) {
            console.error("Error getting Products:", error);
          }
        };
      


    static getOneProduct = async(req,res)=>{
        try{
            let productId = req.params.productId;
            let product = await productsModel.findById(productId).select("-_org");
            res.send(product);
        }
        catch(err){
            return res.send({
                code: 400,
                message: "Please Provide Valid Product Id",
                stack: "Error: Please Provide Valid Product Id",
            }) 
        }
    }


    static createProduct = async(req,res)=>{
        console.log(req.body);
        console.log(req.files);
        console.log(req.seller);


        try {
            // Extract the fields from the request body
            const { name, description, price } = req.body;
            const _org = req.seller._org; // Assuming you have the _org value available in the authenticated user
      
            // Create a new product instance
            const product = new productsModel({
              name,
              description,
              price,
              _org,
              images: req.files.map(file => file.filename),
              sellerId:req.seller._id
            });
            const savedProduct = await product.save();
           //return res.status(201).json(savedProduct);
           return res.send("Product Added Successfully")
          } catch (error) {
            return res.send({
                code: 400,
                message: "Unable To Add Product",
                stack: "Error: Something Went Wrong On Server",
            }) 
          }
    }

    static updateProduct = async(req,res)=>{
        const {name,description,price} = req.body;
        if(name=="" || name==undefined || name==null){
            return res.send({
                code: 400,
                message: "Product Name Required",
                stack: "Error: Product Name Required",
            }) 
        }
        else if(description=="" || description==undefined || description==null){
            return res.send({
                code: 400,
                message: "Product Description Required",
                stack: "Error: Product Description Required",
            }) 
        }
        else if(price==null || price==undefined){
            return res.send({
                code: 400,
                message: "Product Price Required",
                stack: "Error: Product Price Required",
            }) 
        }
        else{
            let productId = req.params.productId;
            try{
                let product = await productsModel.findByIdAndUpdate(productId,{
                    $set:{
                        name:name,
                        description:description,
                        price:price
                    }
                });
                console.log(product,"From Product");
                res.send("Product Updated Successfully");
            }
            catch(err){
                return res.send({
                    code: 400,
                    message: "Please Provide Valid Product Id",
                    stack: "Error: Please Provide Valid Product Id",
                }) 
            }
        }
       
    };

    static deleteProduct = async(req,res)=>{
        try{
            let productId = req.params.productId;
            let product = await productsModel.findById(productId);
            await productsModel.findByIdAndDelete(productId);
            res.send("Product Deleted Successfully")
        }
        catch(err){
            return res.send({
                code: 400,
                message: "Please Provide Valid Product Id",
                stack: "Error: Please Provide Valid Product Id",
            }) 
        }
    };


    static getProductImage = async (req, res) => {
        const { filename } = req.params;
        try {
          // Find the product that contains the requested image
          const product = await productsModel.findOne({ images: filename });
    
          if (!product) {
            return res.status(404).json({ error: 'Image not found' });
          }
    
          // Construct the file path based on your image storage location
          const filePath = path.join('Product-Images', filename);
    
          // Read the image file
          fs.readFile(filePath, (err, data) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Failed to read image file' });
            }
    
            // Set the appropriate response headers
            res.setHeader('Content-Type', 'image/png'); // Adjust the content type based on your image format
            res.send(data);
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Failed to retrieve image' });
        }
      };


      static deleteProductImage = async (req, res) => {
        const { filename } = req.params;
    
        try {
          // Find the product that contains the image to be deleted
          const product = await productsModel.findOne({ images: filename });
    
          if (!product) {
            return res.status(404).json({ error: 'Image not found' });
          }
    
          // Remove the image filename from the product's images array
          const imageIndex = product.images.indexOf(filename);
          if (imageIndex > -1) {
            product.images.splice(imageIndex, 1);
            await product.save();
          }
    
          // Delete the image file from the file system
          const filePath = path.join('Product-Images', filename);
          fs.unlinkSync(filePath);
    
          res.json({ message: 'Image deleted successfully' });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Failed to delete image' });
        }
      };

      static updateProductImages = async (req, res) => {
        try {
          const { productId } = req.params;
          const product = await productsModel.findById(productId);

          if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }
    
          const uploadedImages = req.files.map((file) => file.filename);
    
          if (uploadedImages.length > 0) {
            product.images.push(...uploadedImages);
          }
    
          const updatedProduct = await product.save();
    
          res.json({ product: updatedProduct });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Failed to update product images' });
        }
      };

}

export default ProductsController;