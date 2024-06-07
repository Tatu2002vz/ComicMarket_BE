const router = require("express").Router();
const controller = require("../controllers/payment");
const { verifyAccessToken } = require("../middlewares/verifyToken");

router.post("/create_payment_url", controller.createPaymentUrl);
router.get("/vnpay_ipn", [verifyAccessToken], controller.vnpayIPN);
router.put("/vnpay_return", [verifyAccessToken], controller.vnpayReturn);
module.exports = router;
