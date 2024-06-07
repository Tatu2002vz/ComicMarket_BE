const router = require('express').Router();
const controller = require('../controllers/chapter')
const {verifyAccessToken, isAuthor, isAdmin} = require('../middlewares/verifyToken');
const {isFree} = require('../middlewares/chapterIsFree')
const fileUpload = require('../config/cloudinary.config')
const upload = require('../middlewares/uploadImg')

// router.post('/', controller.createChapter)
router.post('/', upload.array('files', 100), controller.createChapter);
router.get('/', controller.getAllChapter)
router.get('/:id', controller.getListChapter)
router.delete('/:id', controller.deleteChapter)
router.get('/chap/:id', [isFree], controller.getChapter)
router.get('/chapwithslug/:slug', controller.getListChapterWithSlug)
router.put('/updatePrice', controller.updatePrice)
router.put('/:id', upload.array('files', 100), controller.updateChapter)
module.exports = router