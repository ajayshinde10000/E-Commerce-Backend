import express from 'express';
import checkAuth from '../Middeleware/authMiddeleware.js';
import productsController from '../Controllers/productsController.js';
import multer from 'multer';


const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'Product-Images/'); // Specify the destination folder for storing the uploaded images
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = file.originalname.split('.').pop();
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + extension); // Set the filename for each uploaded image
    }
  });
  
const upload = multer({ storage });


router.use('/',checkAuth);
router.use('/:productId',checkAuth);

//Public Routes


//Private Routes
router.get('/',productsController.getProducts);

router.get('/images/:filename',productsController.getProductImage);

router.get('/:productId',productsController.getOneProduct);
router.post('/',upload.array('images'),productsController.createProduct);
router.patch('/images/:productId',upload.array('images'),productsController.updateProductImages);
router.patch('/:productId',productsController.updateProduct);
router.delete('/:productId',productsController.deleteProduct);


//Deal Routes
router.patch('/deal/:productId',productsController.addDiscount);
router.patch('/deal/category/:categoryType',productsController.addDiscountByCategory);
router.put('/deal/discount',productsController.addDiscountToAllProducts);
router.put('/deal/discount/time/:productId',productsController.addDiscountForTimeLimit);
router.put('/deal/discount/individual',productsController.addDiscountToAllProductsOfIndividualSeller);

router.delete('/images/:filename', productsController.deleteProductImage);

export default router;