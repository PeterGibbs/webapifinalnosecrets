var Schema=mongoose.Schema;
var MemeSchema =new Schema({
    url: {type:String},
    userEmail:{type:String}
})
module.exports = mongoose.model('Meme', MemeSchema);