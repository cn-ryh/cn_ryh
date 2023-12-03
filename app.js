import { newProblem, getProblem, checkProblemData, getProblemList, changeProblem } from "./unit/problem.js";
import multiparty from "multiparty";
// const ip = "172.16.8.100"
// const ip = "192.168.1.3"
// const ip = "192.168.1.4"
// const ip = "10.1.14.144"
// const ip = "172.16.8.160"
import express from 'express';
let app = express();
import pkg from 'body-parser';
const { json, urlencoded } = pkg;
import { rename } from "fs";
import { tryLogin, getUserToken, keepLogin, register } from "./unit/user.js";
import { getRecord, searchRecords } from "./unit/record.js";
import { judgeCode } from "./judge.js";
import { downloadFile, getFileList, uploadFiles } from "./unit/files.js";
import { changeTraining, getTraining, getTrainingList, newTraining } from "./unit/training.js";
import backendData from "./unit/database.js";
import { changeContest, getContest, getContestList, newContest } from "./unit/contest.js";
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
// 处理根目录的get请求
app.post('/', (req, res) => {
    //获取登录名称和密码
    const username = req.body.username;
    const password = req.body.password;
    tryLogin(username, password).then((loginres) => {
        res.status(200).send({ login: (loginres !== null) })
    })
})
app.get(`/getProblem/:pid`, function (req, res) {
    getProblem(req.params.pid).then((problem) => {
        res.status(200).send(problem);
    });
})
// File Moudle Begin
app.get('/getFileList', getFileList)
app.post('/uploadFiles', uploadFiles)
app.get(`/downloadFile/:fileid`, downloadFile)
// File Moudle End

app.post('/uploadData', (req, res) => {
    let form = new multiparty.Form({ uploadDir: './Datazips' })
    form.parse(req, (err, fields, file) => {
        if (err) {
            console.error('parse error: ' + err);
        }
        else {
            let inputFile = file.file[0];
            let uploadedPath = inputFile.path;
            let dstPath = './Datazips/' + inputFile.originalFilename;
            //重命名为真实文件名
            rename(uploadedPath, dstPath, function (err) {
                if (err) {
                    res.status(200).send({
                        successUpload: false
                    })
                } else {
                    checkProblemData(inputFile.originalFilename.split(`.zip`)[0])
                        .then((success) => {
                            res.status(200).send(
                                {
                                    successUpload: success
                                })
                        }).catch((err) => {
                            console.error(err);
                        });
                }
            });
        }
    }
    )
})

app.post('/newProblem', function (req, res) {
    newProblem(req.body.title, req.body.description, req.body.author).then((pid) => {
        res.status(200).send({ success: true, pid: pid })
    }).catch((err) => {
        console.error(err)
    })
})
app.post(`/changeProblem/:pid`, changeProblem)
app.get(`/getRecord/:recordId`, (req, res) => {
    const recordid = req.params.recordId;
    getRecord(recordid).then((record) => {
        res.status(200).send(record);
        return;
    }).catch((err) => {
        console.error(err);
        res.status(200).send(null);
    })
})
app.get(`/searchRecord`, (req, res) => {
    searchRecords(req.query).then((records) => {
        res.status(200).send(records);
    }).catch((err) => {
        console.error(err);
        res.status(404).send(`NOT FOUND`);
    })
})

app.get('/getProblemList', function (req, res) {
    getProblemList().then((list) => {
        res.status(200).send(
            {
                problems: list
            })
    })

})

app.post('/problem-submit', async function (req, res) {
    const codes = req.body.codes;
    const problem = req.body.problem;
    const time = req.body.submittime
    const user = req.body.user
    judgeCode(problem, codes, time, user).then((RecordId) => { res.status(200).send(`${RecordId}`) }).catch((err) => {
        console.error(err);
    })
})
app.post(`/register`, (req, res) => {
    register(req.body.username, req.body.password, req.body.email).then((uid) => {
        res.status(200).send(
            {
                success: true,
                uid
            }
        )
    }).catch((err) => {
        console.error(err);
        res.status(200).send(
            {
                success: false,
                reason: err
            })
    })
})
app.post('/login', function (req, res) {
    const head = req.body.head;
    const password = req.body.password;
    tryLogin(head, password).then((loginres) => {
        if (loginres) {
            getUserToken(loginres.uid).then((Usertoken) => {
                res.status(200).send(
                    {
                        login: true,
                        uid: loginres.uid,
                        usertoken: Usertoken
                    }
                )
            })
        }
        else {
            res.status(200).send(
                { nouser: true, login: false }
            )
        }
    })

});

app.post('/keepLogin', keepLogin);

app.get(`/getTrainingList`, getTrainingList)
app.get(`/getTraining/:id`, getTraining)

app.post(`/newTraining`, (req, res) => {
    newTraining(req.body.title, req.body.author, req.body.description, req.body.problems).then(() => {
        res.status(200).send({ success: true })
    })
})
app.post(`/changeTraining/:id`, changeTraining)

app.get(`/getContestList`, (req, res) => { getContestList().then((list) => { res.status(200).send(list) }) })
app.post(`/newContest`, newContest)
app.get(`/getContest/:id`, getContest);
app.post(`/changeContest/:id`, changeContest);

// 监听3000端口
let server = app.listen(3000)

console.log("服务器已运行")
