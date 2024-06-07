const asyncHandler = require('express-async-handler');
const {formidable} = require('formidable')
const createFolderImage =  asyncHandler(async(req, res, next) => {
    const form = formidable({multiples: true})
    try {
        await form.parse()
    } catch(err) {
        console.log(err)
    }
})
module.exports ={
    createFolderImage
}