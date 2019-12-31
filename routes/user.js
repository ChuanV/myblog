var express = require('express')
var router = express.Router()
var User = require('../models/user')
var md5 = require('blueimp-md5')
var path = require('path')
var fs = require('fs')
var Article = require('../models/article')

//登陆页面渲染
router.get('/login',function (req, res, next) {
    res.render('login.html')
})

//注册页面渲染
router.get('/register',function (req, res, next) {
    res.render('register.html')

})

//登陆
router.post('/login',function (req, res, next) {
    var body = req.body
    // console.log(md5(md5(body.password)))
    User.findOne({
        email: body.email,
        password:md5(md5(body.password))
    },function (err,user) {
        if(err){
            return next(err)
        }
        if (!user){
            return res.status(200).json({
                err_code:0,
                message:'Email or password is invalid.'
            })
        }
        req.session.user = user
        return res.status(200).json({
            err_code:1,
            message:'OK'
        })
    })
})

//注册
router.post('/register',function (req, res, next) {
    var body = req.body
    if (!(req.body.email && req.body.password && req.body.nickname )){
        return res.status(200).json({
            err_code:2,
            message:'Email or nickname or password is null.'
        })
    }
    var reg = new RegExp("^[a-z0-9A-Z]+[- | a-z0-9A-Z . _]+@([a-z0-9A-Z]+(-[a-z0-9A-Z]+)?\\.)+[a-z]{2,}$");
    if(!reg.test(req.body.email)){
        return res.status(200).json({
            err_code:3,
            message:'Email or nickname or password is null.'
        })
    }
    if (req.body.nickname.length > 6) {
        req.body.nickname = req.body.nickname.substr(0,6)
    }
    User.findOne({
        email: body.email
    },function (err,data) {
        if (err){
            return res.status(500).json({
                success:false,
                message:'服务器错误'
            })
        }
        if (data){
            return res.status(200).json({
                err_code:0,
                message:'Email  aleady exists.'
            })
            // return res.send(`邮箱或者密码已存在，请重试`)
        }
        body.password = md5(md5(body.password))
        new User(body).save(function (err,user) {
            if(err) {
                return next(err)
            }
            req.session.user = user
            res.status(200).json({
                err_code:1,
                message:'article upload success'
            })
        })

    })
})

//退出
router.get('/logout',function (req, res, next) {
    req.session.user = null
    res.redirect('/login')
})

//个人设置页面渲染
router.get('/settings/profile',function (req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    res.render('./settings/profile.html',{
        user:req.session.user,
        n:Date.now()
    })
})

//个人设置基本信息设置
router.post('/settings/profile',function (req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    let currentTime = formTime()
    req.body.last_modified_time = currentTime
    req.body.birthday = req.body.birthday || req.session.user.birthday
    var gender = req.body.gender
    if ((gender!=(-1))&&(gender!=0)&&(gender!=1)) {
        req.body.gender=-1
    }
    User.update({_id:req.session.user._id},{$set:req.body},{multi:true},function (err,raw) {
        if(err) {
            return next(err)
        }
        if(raw) {
            for(key in req.body){
                req.session.user[key] =req.body[key]
            }
            res.redirect('/settings/profile')
        }
    })

    let name = {nickname:req.body.nickname}
    Article.update({email:req.session.user.email},{$set:name},{multi:true},function (err,raw) {
        if(err) {
            return next(err)
        }
    })
})

//头像修改
router.post('/settings/avatar',function (req, res, next) {
    //头像保存
    if (req.busboy) {
        req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            var saveTo = path.join(__dirname.replace('routes', 'static'),"./avatar/"+Date.now()+path.extname(filename));
            var fileUrl = "/static/avatar/" + path.parse(saveTo).base
            file.pipe(fs.createWriteStream(saveTo));
            let msg = {avatar:fileUrl,last_modified_time:formTime()}
            file.on('end', function () {
                User.update({_id:req.session.user._id},{$set:msg},{multi:true},function (err,raw) {
                    if(err) {
                        return next(err)
                    }
                    if(raw) {
                        req.session.user.avatar = fileUrl;
                        res.redirect('/settings/profile')
                    }
                })
            });
        });
        req.pipe(req.busboy);
    }
})

//账户信息页面渲染
router.get('/settings/admin',function (req, res, next) {
    if(!req.session.user) return res.redirect('/login')
    res.render('./settings/admin.html',{
        user:req.session.user
    })
})

//账户信息修改
router.post('/settings/admin',function (req, res, next) {
    if (!req.body.password) return res.status(200).json({
            err_code:0,
            message:'NO Password!'
    });
    // console.log(req.body)
    req.body.password = md5(md5(req.body.password))
    req.body.last_modified_time = formTime()
    User.update({_id:req.session.user._id},{$set:req.body},{multi:true},function (err,raw) {
        if(err) {
            return next(err)
        }
        if(raw) {
            req.session.user = null
            res.status(200).json({
                err_code:1,
                message:'Password update success'
            })
        }
    })

})

//注销用户
router.post('/settings/delUser',function (req, res, next) {
    if (!req.session.user) {
        return res.status(200).json({
            err_code:0,
            message:'No Login'
        })
    }
    User.remove({_id:req.session.user._id},function (err,raw) {
        if(err) {
            return next(err)
        }
        if(raw) {
            req.session.user = null
            res.status(200).json({
                err_code:1,
                message:'OK'
            })
        }
    })
})



//时间格式化
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

module.exports = router