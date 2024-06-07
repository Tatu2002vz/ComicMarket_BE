const Genre = require('../models/genre')
const asyncHandler = require('express-async-handler')
const sttCode = require('../enum/statusCode')
const getGenre = asyncHandler(async(req, res) => {
    const {id} = req.params
    if(!id) throw new Error('Invalid id genre')
    const genre = await Genre.findById(id)
    return res.status(sttCode.Ok).json({
        success: genre ? true : false,
        mes: genre ? genre : 'Something went wrong!'
    })
})
const getGenres = asyncHandler(async(req, res) => {
    const genre = await Genre.find()
    return res.status(sttCode.Ok).json({
        success: genre ? true : false,
        mes: genre ? genre : 'Something went wrong!'
    })
})
const createGenre = asyncHandler(async(req, res) => {
    const {name} = req.body
    if(!name) throw new Error('Missing name')
    const genre = await Genre.create(req.body)
    return res.status(sttCode.Ok).json({
        success: genre ? true : false,
        mes: genre ? genre : 'Something went wrong!'
    })
})

const updateGenre = asyncHandler(async(req, res) => {
    const {id} = req.params
    const {name} = req.body
    if(!id) throw new Error('Missing id')
    if(!name) throw new Error('Missing name')
    const genre = await Genre.findByIdAndUpdate(id, {name}, {new: true})
    return res.status(sttCode.Ok).json({
        success: genre ? true : false,
        mes: genre ? 'Update success' : 'Something went wrong!'
    })
})

const deleteGenre = asyncHandler(async (req, res) => {
    const {id} = req.params
    if(!id) throw new Error('Missing id')
    const genre = await Genre.findByIdAndDelete(id)
    return res.status(sttCode.Ok).json({
        success: genre ? true : false,
        mes: genre ? 'Delete success' : 'Something went wrong!'
    })
})

module.exports = {
    getGenre: getGenre,
    createGenre: createGenre,
    updateGenre: updateGenre,
    deleteGenre,
    getGenres
}