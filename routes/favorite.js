const router = require("express").Router();
const controller = require("../controllers/favorite");
const { verifyAccessToken } = require("../middlewares/verifyToken");

router.post("/", [verifyAccessToken], controller.createFavorite);
router.get("/", [verifyAccessToken], controller.getAllFavorite);
router.get("/:comicID", [verifyAccessToken], controller.getFavorite);
router.delete("/", [verifyAccessToken], controller.deleteFavorite);

module.exports = router;
