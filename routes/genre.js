const router = require('express').Router();
const Genre = require('../models/genre');
const controller = require('../controllers/genre')
router.get('/', controller.getGenres)
router.get('/:id', controller.getGenre)
router.put('/:id', controller.updateGenre)
router.post('/', controller.createGenre)
router.delete('/:id', controller.deleteGenre)

module.exports = router
