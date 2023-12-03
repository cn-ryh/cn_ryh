import { MarkDown2HTML } from "./markdown2html.js";
import backendData from './database.js';
import fsExtra from "fs-extra"
const { remove, existsSync, readdir, rename, copy } = fsExtra
import compressing from 'compressing'
export class Problem {
    pid = ``
    title = ``
    author = `cn_ryh`
    difficult = 0
    TimeLimit = 1000
    MemoryLimit = 512
    description = ''
    descriptionmd = ''
    datanumber = 0;
    /**
     * @constructor
     * @param {Problem} initProblem 初始化的值
     */
    constructor(initProblem) {
        for (let now in initProblem) {
            this[now] = initProblem[now];
        }
    }
}
function getProblemList() {
    const SQL = `select * from problems order by id`
    return new Promise((resolve, reject) => {
        backendData.query(SQL).then((res) => {
            resolve(res.rows);
        }).catch((err) => {
            reject(err);
        })
    })
}
function changeProblem(req, res) {
    let pid = req.params.pid;
    pid = pid.toUpperCase();
    let SQL = `select * from problems where pid='${pid}'`
    backendData.query(SQL).then((problem) => {
        if (problem.rowCount === 0) {
            res.status(404).send(`Problem Not Found!`);
            return;
        }
        SQL = `update problems set "title"='${req.body.title}',"description"=E'${req.body.description.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"').replace(/'/g, '\\\'')}',"difficult"=${req.body.difficult} where pid='${pid}'`
        backendData.query(SQL).then(() => {
            res.status(200).send(`success`);
        })
    }).catch((err) => {
        console.error(err);
        res.status(404).send(`NOT FOUND`);
    })
}

/**
 * 
 * @param {string} id 题目编号
 * @returns {Promise<Problem | null>}
 */
function getProblem(id) {
    id = id.toUpperCase()
    return new Promise((resolve, reject) => {
        const SQL = `select * from problems where pid='${id}'`;
        backendData.query(SQL).then((res) => {
            if (res.rowCount === 0) {
                resolve(null);
                return;
            }
            let problem = res.rows[0];
            problem.descriptionmd = problem.description;
            problem.description = MarkDown2HTML(problem.description);
            resolve(problem);
        }).catch((err) => {
            console.error(err);
            reject(err);
        })
    })
}
/**
 * 新建题目后端处理
 * @param {string} title 题目名称
 * @param {string} description 题目描述
 * @param {string} author 题目作者
 * @returns {Promise<number>}
 */
async function newProblem(title, description, author) {
    return new Promise((resolve, reject) => {
        let SQL = `select max(id) from problems`;
        backendData.query(SQL).then((mx) => {
            if (!mx.rows[0].max) {
                mx.rows[0] = { max: 0 };
            }
            mx.rows[0].max = Number(mx.rows[0].max);
            const pid = `SY${mx.rows[0].max + 1}`;
            SQL = `INSERT INTO problems (pid,id,title,author,difficult,TimeLimit,MemoryLimit,description) VALUES 
            ('${pid}',${mx.rows[0].max + 1},'${title}','${author}',0,1000,512,E'${description.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"').replace(/'/g, '\\\'')}');`
            backendData.query(SQL).then(() => {
                resolve(pid);
            }).catch((err) => {
                console.error(err);
                reject(err);
            })
        }).catch((err) => {
            console.error(err);
        })
    })
}

/**
 * 
 * @param {string} pid 需要检验数据的题目
 * @returns {Promise<string>}
 */
function checkProblemData(pid) {
    return new Promise((resolve, reject) => {
        if (!existsSync(`./Datazips/${pid}.zip`)) {
            resolve(`文件未上传成功`);
        }
        getProblem(pid).then((problem) => {
            if (!problem) {
                resolve(`题目 ${pid} 不存在`);
                return;
            }
            else {
                // 解压缩文件
                compressing.zip.uncompress(`./Datazips/${pid}.zip`, `./data/${pid}-new/`).then(() => {
                    try {
                        readdir(`./data/${pid}-new/`, (err, files) => {
                            if (err) {
                                return;
                            }
                            let len = files.length
                            let inputDatas = [];
                            let outputDatas = [];
                            let SPJ = '';
                            for (let now = 0; now < len; now++) {
                                if (files[now] === `checker.cpp`) {
                                    SPJ = files[now];
                                    continue;
                                }
                                if (/.ans$/.test(files[now])) {
                                    outputDatas.push(files[now]);
                                }
                                else if (/.out$/.test(files[now])) {
                                    outputDatas.push(files[now]);
                                }
                                else if (/.in$/.test(files[now])) {
                                    inputDatas.push(files[now]);
                                }
                                else {
                                    remove(`./data/${pid}`)
                                    remove(`./data/${pid}-new`)
                                    resolve(`检测到不能识别的文件 ${files[now]}`);
                                    return;
                                }
                            }
                            if (inputDatas.length !== outputDatas.length) {
                                remove(`./data/${pid}`)
                                remove(`./data/${pid}-new`)
                                resolve(`输入文件与输出文件数量不符`);
                            }
                            let cnt = 0;
                            for (let nowInputFile of inputDatas) {
                                ++cnt;
                                let nowOutputFile = outputDatas.find((outputFileName) => {
                                    return (outputFileName.split(`.ans`)[0] == nowInputFile.split(`.in`)[0]) || (outputFileName.split(`.out`)[0] == nowInputFile.split(`.in`)[0]);
                                })
                                if (!nowOutputFile) {
                                    remove(`./data/${pid}`)
                                    remove(`./data/${pid}-new`)
                                    resolve(`未检测到与 ${nowInputFile} 匹配的输出文件`);
                                }
                                else {
                                    rename(`./data/${pid}-new/${nowInputFile}`, `./data/${pid}-new/${cnt}.in`, () => { })
                                    rename(`./data/${pid}-new/${nowOutputFile}`, `./data/${pid}-new/${cnt}.ans`, () => { })
                                }
                            }
                            backendData.query(`update problems set datanumber=${cnt},spjon=${SPJ == '' ? false : true} where pid='${pid}'`).then(() => {
                                remove(`./data/${pid}`).then(() => {
                                    copy(`./data/${pid}-new`, `./data/${pid}`).then(() => {
                                        remove(`./data/${pid}-new`)
                                        resolve(`上传成功`)
                                    });
                                })
                            }).catch((err) => {
                                reject(err);
                                return;
                            })

                        })
                    }
                    catch (err) {
                        console.error(err);
                        resolve(`文件未上传成功`);
                    }
                })
            }
        })

    })
}
export { changeProblem, checkProblemData, newProblem, getProblem, getProblemList }