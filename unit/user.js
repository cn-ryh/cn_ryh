import { sha266 } from "./sha266.js";
import backendData from "./database.js";
class User {
    uid = 0
    username = ``;
    admin = false;
    password = ``;
    email = ``;
    /**
     * 构造函数
     * @param {User} initUser 初始化的值
     */
    constructor(initUser) {
        for (let now in initUser) {
            this[now] = initUser[now]
        }
    }
}
/**
 * 向数据库插入用户数据
 * @param {User[]} users 要插入的用户列表
 * @returns {Promise<void>}
 */
function insertIntoUserList(users) {
    return new Promise((resolve, reject) => {
        if (users.length == 0) {
            reject(`ERR: Can't insert empty users!`);
            return;
        }
        let SQL = `insert into users (uid,username,admin,password,email) values`;
        let len = users.length;
        for (let i = 0; i < len - 1; i++) {
            const user = users[i];
            SQL += `(${user.uid},'${user.username}',${user.admin},'${user.password}','${user.email})'),`
        }
        const user = users[len - 1];
        SQL += `(${user.uid},'${user.username}',${user.admin},'${user.password}','${user.email}');`
        backendData.query(SQL).then(() => {
            resolve();
        }).catch((err) => {
            reject(err);
        })
    })
}
/**
 * 注册时检测用户名是否合法
 * @param {string} username 检查的用户名
 * @returns {Promise<string>}
 */
function registerCheck(username) {
    return new Promise((resolve, reject) => {
        if (!isNaN(Number(username))) {
            resolve(`用户名不能为纯数字`);
            return;
        }
        const SQL = `select uid,username from users where username='${username}'`
        backendData.query(SQL).then((res) => {
            if (res.rowCount !== 0) {
                resolve(`存在相同用户名`);
                return;
            }
            backendData.query(`select max(uid) from users`).then((mx) => { resolve(mx.rows[0].max); })
        }).catch((err) => {
            console.error(err);
            reject(err);
        })
    })
}

/**
 * 注册用户接口
 * @param {string} username 用户名
 * @param {string} password 密码
 * @param {string} email 邮箱
 * @returns {Promise<number>}
 */
function register(username, password, email) {
    return new Promise((resolve, reject) => {
        registerCheck(username).then((res) => {
            if (isNaN(Number(res))) {
                reject(res);
                // console.error(`aaaa`)
                return;
            }

            let user = new User();
            user.email = email;
            user.username = username;
            user.password = password;
            user.uid = res + 1;

            insertIntoUserList([user]).then(() => { resolve(user.uid) }).catch((err) => {
                console.error(err);
                reject(err);
            })
        })
    })
}
/**
 * 
 * @param {number} uid 用户编号
 * @returns 
 */
function getUserToken(uid) {
    return new Promise((resolve, reject) => {
        getUser(uid).then((user) => {
            if (user === null) {
                reject(`ERR: User ${uid} not found!`);
                return;
            }
            const username = user.name;
            const password = user.password;
            resolve(sha266(uid.toString() + password + username).substring(0, 128));
        }).catch((err) => {
            reject(err);
        })
    })
}
/**
 * 获取用户
 * @param {string} head 登录头
 * @returns {Promise<User|null>}
 */
function getUser(head) {
    return new Promise((resolve, reject) => {
        if (head == ``) {
            reject(`ERR:Login head can't be empty!`);
            return;
        }
        if (!isNaN(Number(head))) {
            backendData.query(`select * from users where uid=${head}`).then((res) => {
                if (res.rowCount === 0) {
                    resolve(null);
                }
                else {
                    resolve(res.rows[0]);
                }

            }).catch((err) => {
                console.error(err);
                reject(err);
            })
        }
        else {
            backendData.query(`select * from users where username='${head}'`).then((res) => {
                if (res.rowCount === 0) {
                    resolve(null);
                }
                else {
                    resolve(res.rows[0]);
                }

            }).catch((err) => {
                console.error(err);
                reject(err);
            })
        }
    })
}
/**
 * 
 * @param {string} head 登录名
 * @param {string} password 密码
 * @returns {Promise<User | null>} 用户
 */
function tryLogin(head, password) {
    return new Promise((resolve, reject) => {
        getUser(head).then((user) => {
            if (user == null) {
                resolve(null);
                return;
            }
            // 密码正确
            if (user.password === password) {
                resolve(user);
            }
            // 密码错误
            else {
                resolve(null);
            }
        }).catch((err) => {
            console.error(err);
        })
    })

}
/**
 * 
 * @param {number} uid 用户编号
 * @param {string} token 验证的 Token
 * @returns {Promise<{logined,admin}>}
 */
function keepLogin(req, res) {
    let uid = req.body.uid;
    let token = req.body.usertoken
    getUser(uid).then((user) => {
        if (!user) {
            res.status(200).send(null)
            return;
        }
        getUserToken(uid).then((userRightToken) => {
            if (userRightToken === token) {
                const ResolveRes = {
                    logined: true,
                    admin: user.admin
                }
                res.status(200).send(ResolveRes)
                return;
            }
            else {
                res.status(200).send({
                    logined: false,
                    admin: false
                })
            }
        }).catch((err) => {
            res.status(200).send(null)
        })
    }).catch((err) => {
        res.status(200).send(null)
    })
}
export { getUser, register, tryLogin, getUserToken, keepLogin }