import backendData from "./database.js";
import { getUser } from "./user.js";
export const State = {
    "Accept": "Accept",
    "Waiting": "Waiting",
    "UnAccept": "UnAccept",
    "Wrong Answer": "Wrong Answer",
    "Time Limit Error": "Time Limit Error",
    "Compile Error": "Compile Error",
    "Memory Limit Error": "Memory Limit Error",
    "Unknow Error": "Unknow Error",
    "Judging": "Judging",
    "Runtime Error": "Runtime Error"
}
export class JudgePoint {
    index = 1;
    state = ``;
    time = 0;
    memory = 0;
    /**
     * 
     * @param {JudgePoint} initJudgePoint 
     */
    constructor(initJudgePoint) {
        for (let now in initJudgePoint) {
            this[now] = initJudgePoint[now];
        }
    }
    toSQLString() {
        return `{
    "index": ${this.index},
    "state": "${this.state}",
    "time": ${this.time},
    "memory": ${this.memory}
}`
    }
}

export class Record {
    id
    user
    problem
    submitTime = ``
    state = State.Accept
    sumtime = 0
    maxtime = 0
    memory = 512
    detail = []
    point = 0
    code = ``
    /**
     * 
     * @param {Record} initRecord 需要构造的
     */
    constructor(initRecord) {
        for (let now in initRecord) {
            this[now] = initRecord[now];
        }
    }
    toString() {
        let res =
            `{
            "id": ${this.id},
            "user": "${this.user}",
            "problem": "${this.problem}",
            "submitTime": "${this.submitTime}",
            "state": "${this.state}",
            "sumtime": ${this.sumtime},
            "maxtime": ${this.maxtime},
            "memory": ${this.memory},
            "point": ${this.point},
            "code": "${this.code}",
            "detail":[
        `;
        const len = this.detail.length;
        for (let i = 0; i < len - 1; i++) {
            res += this.detail[i].toSQLString() + ",\n";
        }
        if (len) {
            res += this.detail[len - 1].toSQLString();
        }
        res += "]}";

        return res
    }
}
/**
 * 
 * @param {number} rid 提交记录编号
 * @returns {Promise<Record | null>}
 */
function getRecord(rid) {
    return new Promise((resolve, reject) => {
        backendData.query(`select * from records where id=${rid}`).then((record) => {
            if (record.rowCount === 0) {
                resolve(null)
            }
            else {
                resolve(record.rows[0]);
            }
        }).catch((err) => {
            reject(err);
        })
    })
}
/**
 * @param searchOptions 
 * @returns {Promise<Record[]>}
 */
function searchRecords(searchOptions) {
    return new Promise(async (resolve, reject) => {
        let SQL = `select * from records`
        if (Object.keys(searchOptions).length == 0) {
            backendData.query(SQL).then((records) => {
                resolve(records.rows[0]);
            }).catch((err) => {
                console.error(err);
                reject(err);
            })
        }
        else {
            SQL += ` where`;
            if (searchOptions.user) {
                SQL += `"user"='${(await getUser(searchOptions.user)).username}' and `
            }
            for (let now in searchOptions) {
                if (now == `user`) {
                    continue;
                }
                SQL += ` "${now}"='${searchOptions[now]}' and`
            }
            SQL += ` true order by id`;
            backendData.query(SQL).then((records) => {
                resolve(records.rows);
            }).catch((err) => {
                console.error(err);
                reject(err);
            })
        }
    })

}

export { getRecord, searchRecords }