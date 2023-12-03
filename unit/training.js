import { rejects } from "assert";
import backendData from "./database.js";
import { MarkDown2HTML } from "./markdown2html.js";
import { Problem, getProblem } from "./problem.js";
function getTrainingList(req, res) {
    const SQL = `select * from trainings order by id`
    backendData.query(SQL).then((trainings) => {
        res.status(200).send(trainings.rows);
        return;
    }).catch((err) => {
        console.error(err);
    })
}

function getTraining(req, res) {
    const id = req.params.id;
    backendData.query(`select * from trainings where id=${id}`).then(async (training) => {
        if (!training.rowCount) {
            res.status(404).send(`NOT FOUND`);
            return;
        }
        let flag = {};
        flag.title = training.rows[0].title;
        flag.descriptionmd = training.rows[0].description;
        flag.description = MarkDown2HTML(training.rows[0].description);
        flag.author = training.rows[0].author;
        flag.id = training.rows[0].id;
        flag.problems = [];
        let problems = training.rows[0].problems;
        for (let now of problems) {
            let x = await getProblem(now.problem);
            if (x === null) {
                continue;
            }
            x.description = undefined;
            flag.problems.push(x);
        }
        res.status(200).send(flag);
    })
}
/**
 * 
 * @param {string} title 题单名称
 * @param {string} author 题单作者
 * @param {string} description 描述
 * @param {Problem[]} problems 
 * @returns 
 */
function newTraining(title, author, description, problems) {
    return new Promise((resolve, reject) => {
        let SQL = `select max(id) from trainings`;
        backendData.query(SQL).then((mx) => {
            if (!mx.rows[0].max) {
                mx.rows[0] = { max: 0 };
            }
            mx.rows[0].max = Number(mx.rows[0].max);
            SQL = `INSERT INTO trainings (id,title,author,description,problems) VALUES 
            (${mx.rows[0].max + 1},'${title}','${author}',E'${description.replace(/\\/g, '\\\\').replace(/\r\n/g, '\n').replace(/\n/g, '\\n').replace(/"/g, '\\"').replace(/'/g, '\\\'')}','${JSON.stringify(problems)}'::json);`
            backendData.query(SQL).then(() => {
                resolve();
            }).catch((err) => {
                console.error(err);
                reject(err);
            })
        }).catch((err) => {
            console.error(err);
        })
    })
}
function changeTraining(req, res) {
    let id = req.params.id;
    let SQL = `select * from trainings where id=${id}`
    backendData.query(SQL).then((trainingRows) => {
        if (trainingRows.rowCount === 0) {
            res.status(404).send(`Training Not Found!`);
            return;
        }
        SQL = `update trainings set "title"='${req.body.title}',"description"=E'${req.body.description.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"').replace(/'/g, '\\\'')}',"problems"='${JSON.stringify(req.body.problems)}'::json where id=${id}`
        backendData.query(SQL).then(() => {
            res.status(200).send(`success`);
        })
    }).catch((err) => {
        console.error(err);
    })
}
export { getTraining, getTrainingList, newTraining, changeTraining }