const router = require('express').Router();
const controller = require('../controllers/insertData')


router.post('/', controller.insertGenres)
router.post('/comic', controller.insertComics)
router.post('/chapter', controller.insertChapters)
router.delete('/', controller.removeComics)
module.exports = router