const router = require('express').Router();

const controller = require('../controllers/comment');
const { verifyAccessToken } = require('../middlewares/verifyToken');



router.get('/:id', controller.getCommentWithComic)
router.get('/chapter/:id', controller.getCommentWithIdChapter)
router.post('/:id', [verifyAccessToken], controller.createComment)
module.exports = router