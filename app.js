
import express from 'express';
let app = express();
import pkg from 'body-parser';
const { json, urlencoded } = pkg;
//增加头部信息解决跨域问题
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", `*`);
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("X-Powered-By", ' 3.2.1');
    next();
});
//使用bodyParse解释前端提交数据
app.use(urlencoded({ extended: true }));
app.use(json());

app.get('/', (req, res) => {
    res.status(200).send("Welcome")
})

// 监听3000端口
let server = app.listen(3000)

console.log("服务器已运行")
