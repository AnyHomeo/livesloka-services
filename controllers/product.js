const {
  createStripeProduct,
  updateStripeProduct,
  deleteStripeProduct
} = require("../controllers/stripe");
const Product = require("../models/Product.model");
const ObjectId = require("mongoose").Types.ObjectId;

exports.createProduct = async (req, res) => {
  try {
    const { name, description, subject } = req.body;

    if (!subject && !ObjectId.isValid(subject)) {
      return res.status(400).json({ error: "Invalid subject", result: null });
    }

    //check if already exists
    let alreadyExists = await Product.findOne({ subject,isDeleted:false });
    if (alreadyExists) {
      return res.status(400).json({
        error: "Product already exists. Delete it and create New product",
        result: null,
      });
    }

    //create local product
    const newProduct = await Product.create({
      name,
      description,
      subject,
    });

    //create stripe product
    let stripeProduct = await createStripeProduct({
      name,
      description,
      id: newProduct._id.toString(),
      metadata: { subject },
    });
    console.log(stripeProduct);
    //validate and respond
    if (stripeProduct.type === "success") {
      return res.json({
        result: newProduct,
        message: "Product created successfully!",
      });
    } else {
      return res.status(500).json({
        result: stripeProduct.result,
        error: "Something went wrong in creating the product!",
      });
    }
  } catch (error) {
    //handle error
    return res.status(500).json({
      result: error,
      error: "Something went wrong in creating the stripe product!",
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    //get all products
    const allProducts = await Product.find({ isDeleted: false });
    return res.json({
      result: allProducts,
      message: "All products retrieved successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      result: error,
      error: "Something went wrong in retrieving products!",
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, active } = req.body;
    const { productId } = req.params;
    let newFields = {};
    if (name !== undefined) newFields.name = name;
    if (description !== undefined) newFields.description = description;
    if (active !== undefined) newFields.active = active;

    if (productId && ObjectId.isValid(productId)) {
      //update in  stripe
      let updatedStripeProduct = await updateStripeProduct(
        productId,
        newFields
      );
      if (updatedStripeProduct.type === "success") {
        //update local db
        let newUpdate = await Product.findByIdAndUpdate(productId, newFields);
        return res.json({
          message: "Product updated successfully!",
          result: newUpdate,
        });
      } else {
        //handle error
        return res.status(500).json({
          result: stripeProduct.result,
          error: "Something went wrong in updating the stripe product!",
        });
      }
    } else {
      return res.status(400).json({
        result: null,
        error: "Invalid Product Id",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      result: error,
      error: "Something went wrong in updating the product!",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (productId && ObjectId.isValid(productId)) {
        let newUpdate = await Product.findByIdAndUpdate(productId, {
          isDeleted: true,
        });
        return res.json({
          message: "Product Deleted successfully!",
          result: newUpdate,
        });
    } else {
      return res.status(400).json({
        result: null,
        error: "Invalid Product Id",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      result: error,
      error: "Something went wrong in deleting the product!",
    });
  }
};
