const router = require("express").Router();
const controller = require("../controllers/history");
const { verifyAccessToken } = require("../middlewares/verifyToken");

router.post("/", [verifyAccessToken], controller.createHistory);
router.get("/", [verifyAccessToken], controller.getHistory);

module.exports = router;
