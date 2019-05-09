var Schema=mongoose.Schema;
var UserSchema = new Schema({
    email:{type:String, required: true, unique: true},
    address: String,
    sendDirect: Boolean
});


module.exports = mongoose.model('User', UserSchema);