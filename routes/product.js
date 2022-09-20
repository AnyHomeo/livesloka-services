const express = require('express');
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} = require('../controllers/product');
const router = express.Router();

router.post('/', createProduct);
router.get('/', getAllProducts);
router.put('/:productId', updateProduct);
router.delete('/:productId', deleteProduct);
module.exports = router;
