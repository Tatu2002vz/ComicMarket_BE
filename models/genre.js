const mongoose = require('mongoose')

var genreSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Genre', genreSchema)