var mongoose=require('mongoose');  
var Schema=mongoose.Schema; 

var contactSchema=new Schema({
    name:{type:String},
    email:{type:String},
    contact_no:{type:Number},
    ownerId:{type:String},
    date:{type:Date, default:Date.now()} 
});
  
module.exports=mongoose.model('contacts', contactSchema);