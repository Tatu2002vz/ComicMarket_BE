const mongoose = require('mongoose');

var purchaseSchema = new mongoose.Schema({
    user : {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    chapter: {
        type: mongoose.Types.ObjectId,
        ref: 'Chapter'
    },
    comic: {
        type: mongoose.Types.ObjectId,
        ref: 'Comic'
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true, //
})


module.exports = mongoose.model('Purchase', purchaseSchema)