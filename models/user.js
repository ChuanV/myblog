var mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/test',{ useNewUrlParser: true })

var Schema = mongoose.Schema

var userSchema = new Schema({
    email:{
        type:String,
        required:true
    },
    nickname:{
        type: String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    created_time:{
        type:String,
        default:formTime()
    },
    last_modified_time:{
        type:String,
        default:formTime()
    },
    avatar:{
        type:String,
        default:'/public/img/avatar-default.png'
    },
    bio:{
        type:String,
        default:''
    },
    gender:{
        type:Number,
        enum:[-1,0,1],
        default:-1
    },
    birthday:{
        type:String
    },
    status:{
        type:Number,
        enum: [0,1,2],
        default:0
    }


})

function formTime(){
    let time =new Date()
    let year = time.getFullYear()
    let month = (time.getMonth()+1).toString().padStart(2,0)
    let day = time.getDate().toString().padStart(2,0)
    let hour = time.getHours().toString().padStart(2,0)
    let minutes = time.getMinutes().toString().padStart(2,0)
    let second = time.getSeconds().toString().padStart(2,0)
    return `${year}-${month}-${day} ${hour}:${minutes}:${second}`;
}


module.exports = mongoose.model('User',userSchema)