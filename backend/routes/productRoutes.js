const express = require("express");
const { getAllProducts, createProduct, updateProduct, deleteProduct, getSingleProduct, createProductReview } = require("../controllers/productController");
const { isAuthenticated, authorizedRoles } = require("../middleware/auth");

const router = express.Router();

router.route("/products").get(getAllProducts);

router.route("/product/new").post( isAuthenticated, authorizedRoles("admin"), createProduct);

router.route("/product/id").put( isAuthenticated, authorizedRoles("admin"), updateProduct).delete( isAuthenticated, authorizedRoles("admin"),  deleteProduct).get(getSingleProduct);

router.route("/review").put(isAuthenticated,  createProductReview);

module.exports=router;