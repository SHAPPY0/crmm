var mongoose=require('mongoose');  
var Schema=mongoose.Schema; 

var citySchema=new Schema({
	city:String,
    state:String
});
  
module.exports=mongoose.model('cities', citySchema);