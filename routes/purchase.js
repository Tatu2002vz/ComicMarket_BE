const router = require("express").Router();
const controller = require("../controllers/purchase");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

router.get("/", [verifyAccessToken, isAdmin], controller.getAllPurchase);
router.post("/:id", [verifyAccessToken], controller.createPurchase);
router.get("/:id", [verifyAccessToken], controller.getPurChase);
module.exports = router;
