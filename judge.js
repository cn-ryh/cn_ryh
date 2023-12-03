import { exec, execSync } from 'child_process';
import { Record, JudgePoint, State } from './unit/record.js'
import fsExtra from 'fs-extra';
const { existsSync, unlinkSync, unlink, statSync, rmdirSync, readdirSync, mkdirSync, copy, readFile, writeFile, readFileSync, writeFileSync } = fsExtra;
import os from 'os';
import { getUser } from './unit/user.js';
import backendData from './unit/database.js';
import { randomInt } from 'crypto';
let nowcnt = 0;
const mxJudge = ((os.type == `Linux`) ? (5) : (10));
let nowRecordId = (await backendData.query(`select max(id) from records;`)).rows[0].max;
// let JudgeQueue = []
// let onJudge = false
// let FileOperatortionQueue = []
function deleteFolderRecursive(path, dep = 0) {
    if (existsSync(path)) {
        readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            if (statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath, dep + 1);
            } else { // delete file
                unlinkSync(curPath);
            }
        });
        setTimeout(() => {
            rmdirSync(path)
        }, 20 * (10 - dep));
    }
};

/**
 * 运行选手程序
 * @param {number} recordId 提交记录 id
 * @param {number} caseId 测试点 id
 * @returns {Promise<{begtim:number,edtim:number}>}
 */
async function RunCode(recordId, caseId, TimeLimit) {
    await sleep(50 + Math.floor(Math.random() * 100) + 1);
    await waitQueue();
    console.log(`开始评测记录 ${recordId} 的测试点 ${caseId}，当前测试点数量 ${nowcnt}`)
    ++nowcnt
    await sleep(50);
    return new Promise((resolve, reject) => {
        if (os.type == `Linux`) {
            const begtim = new Date().getTime();
            exec(`time ./testObj/${recordId}/${recordId}-${caseId}.exe <./testObj/${recordId}/${caseId}.in >./testObj/${recordId}/${caseId}.out`, { cwd: process.cwd(), timeout: TimeLimit * 2, windowsHide: true }, (err, stdout, stderr) => {
                const edtim = new Date().getTime();
                if (err) {
                    try {
                        execSync(`killall ${recordId}-${caseId}.exe`);
                    } catch (err) {
                        console.error(err);
                    }
                    resolve({ begtim, edtim });
                }
                else {
                    resolve({ begtim, edtim });
                }

            });
        }
        else {
            const begtim = new Date().getTime();
            exec(`${process.cwd()}\\testObj\\${recordId}\\${recordId}-${caseId}.exe <${process.cwd()}\\testObj\\${recordId}\\${caseId}.in >${process.cwd()}\\testObj\\${recordId}\\${caseId}.out`, { cwd: process.cwd(), timeout: TimeLimit * 2.0, windowsHide: true }, (err, stdout, stderr) => {
                const edtim = new Date().getTime();
                if (err) {
                    try {
                        execSync(`taskkill /F /im ${recordId}-${caseId}.exe`);
                    } catch (err) {
                        console.error(err);
                    }
                    resolve({ begtim, edtim });
                }
                else {
                    resolve({ begtim, edtim });
                }
            });
        }
    })
}

/**
 * 全文比较评测器
 * @param {number} recordId 提交记录 id
 * @param {number} caseId 测试点 id
 * @param {string} ans 标准答案
 * @returns {Promise<boolean>}
 */
function JudgerCompareAllSame(recordId, caseId, ans) {
    return new Promise((resolve, reject) => {
        readFile(`./testObj/${recordId}/${caseId}.out`, "utf-8").then((userOutPut) => {

            userOutPut = userOutPut.replace(/(?<!\n\s*)\ +\n/g, '');
            // while (/(\n|(\n\r)|(\r\n)|\ )$/.test(userOutPut)) {
            userOutPut = userOutPut.replace(/(\n|(\n\r)|(\r\n)|\ )*$/, '');
            // }
            ans = ans.replace(/(?<!\n\s*)\ +\n/g, '');
            // while (/(\n|(\n\r)|(\r\n)|\ )$/.test(ans)) {
            ans = ans.replace(/(\n|(\n\r)|(\r\n)|\ )*$/, '');
            // }
            ans = ans.replace(/(\n\r)|(\r\n)|(\n)/g, `\n`);
            userOutPut = userOutPut.replace(/(\n\r)|(\r\n)|(\n)/g, `\n`);
            resolve(userOutPut === ans);
        }
        ).catch((err) => {
            console.error(err);
            reject(err);
        });
    })
}
/**
 * 评测队列等待辅助函数
 * @returns {Promise<void>}
 */
async function waitQueue() {
    return new Promise((resolve, reject) => {
        if (nowcnt >= mxJudge) {
            setTimeout(() => {
                waitQueue().then(() => {
                    resolve();
                })
            }, randomInt(100) + 100);
        }
        else {
            resolve();
            return;
        }
    })

}
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
/**
 * 
 * @param {string} problem 题目编号
 * @param {number} caseId 测试点 id
 * @param {number} recordId 提交记录 id
 * @param {number} TimeLimit 时间限制
 * @returns {Promise<JudgePoint>}
 */
async function judgePoint(problem, caseId, recordId, TimeLimit = 1000) {
    return new Promise((resolve, reject) => {
        let result = new JudgePoint();
        result.index = caseId;
        Promise.all([
            // 复制输入文件
            new Promise((Inputresolve, Inputreject) => {
                copy(`./data/${problem}/${caseId}.in`, `./testObj/${recordId}/${caseId}.in`).then(() => {
                    Inputresolve();
                }).catch((err) => {
                    console.error(err);
                    Inputreject(err);
                });
            }),

            // 读取输出文件
            new Promise((Outputresolve, Outputreject) => {
                readFile(`./data/${problem}/${caseId}.ans`, "utf-8").then((data) => {
                    Outputresolve(data);
                }).catch((err) => {
                    Outputreject(err);
                })
            }),
            // 创建编译文件
            new Promise((Makeresove, Makereject) => {
                if (!existsSync(`${process.cwd()}/testObj/${recordId}/all.exe`)) {
                    Makereject();
                    return;
                }
                copy(`${process.cwd()}/testObj/${recordId}/all.exe`, `${process.cwd()}/testObj/${recordId}/${recordId}-${caseId}.exe`).then(() => {
                    try {
                        writeFile(`./testObj/${recordId}/${caseId}.bat`,
                            `${process.cwd()}\\testObj\\${recordId}\\${recordId}-${caseId}.exe <${process.cwd()}\\testObj\\${recordId}\\${caseId}.in >${process.cwd()}\\testObj\\${recordId}\\${caseId}.out`, "utf-8").then(() => {
                                Makeresove();
                            }).catch((err) => {
                                Makereject(err);
                            });
                    }
                    catch (err) {
                        console.error(err);
                        Makereject(err);
                        return;
                    }
                }).catch((err) => {
                    Makereject(err);
                    return;
                });
            })
        ]
        ).then((datas) => {
            let OutputData = datas[1]
            RunCode(recordId, caseId, TimeLimit).then((times) => {
                const begtim = times.begtim
                const edtim = times.edtim
                if ((edtim - begtim) * 0.7 > TimeLimit) {
                    result.state = State['Time Limit Error']
                    result.memory = 0;
                    result.time = Math.max(3, (edtim - begtim) * 0.7).toFixed(0);
                    console.log(`记录 ${recordId} 的测试点 ${caseId} 评测结束 用时 ${edtim - begtim}ms`)
                    --nowcnt;
                    resolve(result);
                }
                else {
                    JudgerCompareAllSame(recordId, caseId, OutputData).then((JudgeResult) => {
                        console.log(`记录 ${recordId} 的测试点 ${caseId} 评测结束 用时 ${edtim - begtim}ms`)
                        --nowcnt;

                        if (JudgeResult) {
                            result.state = State.Accept;
                        }
                        else {
                            result.state = State['Wrong Answer']
                        }
                        result.memory = 0;
                        result.time = Math.max(3, (edtim - begtim) * 0.7).toFixed(0);
                        resolve(result);
                        return;
                    }).catch((err) => {
                        console.error(err);
                        --nowcnt;
                        reject(err);
                        return;
                    })
                }

            }).catch(() => {
                result.state = State['Unknow Error'];
                result.time = 0;
                --nowcnt;
                resolve(result);
                return;
            })
        }).catch((err) => {
            result.state = State['Unknow Error']
            reject(err);
            return;
        });
    })
}
/**
 * 
 * @param {Record} res 
 * @returns {Promise<void>} 
*/
function addToRecordList(res) {
    res.detail.sort((a, b) => {
        return a.index - b.index;
    })
    return new Promise((resolve, reject) => {
        const SQL =
            `with RecordJSON (doc) as (
values(E'[${res.toString()}]'::json))
insert into records 
select p.* from RecordJSON l
cross join lateral json_populate_recordset(null::records,doc) as p
on conflict (id) do update 
set "user" = excluded.user, 
problem=excluded.problem,
"submitTime"=excluded."submitTime",
id=excluded.id,
"state"=excluded.state,
"sumtime"=excluded.sumtime,
"maxtime"=excluded.maxtime,
memory=excluded."memory",
detail=excluded.detail,
point=excluded.point,
"code"=excluded."code";`
        backendData.query(SQL).then(() => {
            resolve();
        }).catch((err) => {
            reject(err);
        })
    })
}
/**
 * 
 * @param {number} problem 
 * @param {string} code user Codes
 * @returns {Promise<number>} 返回提交记录 id 
 */
async function judgeCode(problem, code, time, user) {
    return new Promise((resolve) => {
        nowRecordId++;
        const recordId = nowRecordId;
        let res = new Record({
            // problem
            user: '',
            submitTime: time,
            point: 0,
            problem: problem,
            id: recordId,
            state: State.Judging,
            sumtime: 0,
            maxtime: 0,
            memory: 0,
            detail: [],
            code: code.replace(/\\/g, '\\\\\\\\').replace(/\r\n/g,'\n').replace(/\n/g, '\\\\n').replace(/"/g, '\\\\"').replace(/'/g, '\\\'')
        })
        addToRecordList(res).then(() => {
            resolve(recordId);
        }).catch((err) => {
            console.error(err);
        })
        getUser(user).then((user) => {
            res.user = user.username
            addToRecordList(res).catch((err) => {
                console.error(err);
            })
            console.log(`开始评测提交记录 ${recordId}`)
            const SQL = `select * from problems where pid='${problem}'`
            backendData.query(SQL).then((datas) => {
                let data = datas.rows[0];
                if ((!data) || !(data.datanumber)) {
                    res.detail.push(new JudgePoint({
                        id: 1,
                        state: State['Unknow Error']
                    }))
                    res.state = State['Unknow Error'];
                    deleteFolderRecursive(`./testObj/${recordId}`);
                    addToRecordList(res);
                    resolve(res);
                    return;
                }
                const testDataNumber = data.datanumber;
                const testDataTime = data.timelimit;
                mkdirSync(`./testObj/${recordId}`)
                const PointPreCase = Math.floor(100.00 / (1.0 * testDataNumber))
                try {
                    writeFileSync(`./testObj/${recordId}/main.cpp`, code, "utf-8");
                }
                catch (err) {
                    console.error(err);
                    res.state = State['Unknow Error'];
                    console.log(`提交记录 ${recordId} 评测结束，状态为 ${res.state}`)
                    deleteFolderRecursive(`./testObj/${recordId}`);
                    addToRecordList(res);
                    return;
                }
                try {
                    execSync(`g++ ./testObj/${recordId}/main.cpp -o ./testObj/${recordId}/all.exe`);
                }
                catch (err) {
                    console.error(err);
                    res.state = State['Compile Error'];
                    console.log(`提交记录 ${recordId} 评测结束，状态为 ${res.state}`)
                    addToRecordList(res);
                    deleteFolderRecursive(`./testObj/${recordId}`);
                    return;
                }

                let JudgeTaskList = [];
                for (let testCaseId = 1; testCaseId <= testDataNumber; testCaseId++) {
                    JudgeTaskList.push(judgePoint(problem, testCaseId, recordId, testDataTime));
                }
                Promise.allSettled(JudgeTaskList).then((datas) => {
                    for (let testCaseId = 0; testCaseId < testDataNumber; testCaseId++) {
                        // 评测成功的
                        if (datas[testCaseId].status === `fulfilled`) {
                            res.detail.push(datas[testCaseId].value);
                        }
                        // 评测失败的
                        else {
                            let errcase = new JudgePoint();
                            errcase.state = State['Unknow Error'];
                            res.detail.push(errcase);
                        }
                    }
                    res.state = State.Accept
                    for (let testCaseId = 0; testCaseId < res.detail.length; testCaseId++) {
                        if (res.detail[testCaseId].state != State.Accept) {
                            res.state = State.UnAccept;
                        }
                        else {
                            res.point += PointPreCase;
                        }
                        res.sumtime += Number(res.detail[testCaseId].time);
                        res.maxtime = Math.max(res.maxtime, res.detail[testCaseId].time);
                    }
                    addToRecordList(res).then(() => {

                    }).catch((err) => {
                        console.error(err);
                    });
                    console.log(`提交记录 ${recordId} 评测结束，状态为 ${res.state}`)
                    deleteFolderRecursive(`./testObj/${recordId}`);
                }).catch((err) => {
                    console.log(`评测出现错误: ${err}`)
                    res.state = State['Unknow Error'];
                    console.log(`提交记录 ${recordId} 评测结束，状态为 ${res.state}`)
                    addToRecordList(res);
                    deleteFolderRecursive(`./testObj/${recordId}`);
                });
            })
        })
    })
}
export { judgeCode }