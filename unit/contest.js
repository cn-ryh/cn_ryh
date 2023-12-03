import backendData from "./database.js"
import { MarkDown2HTML } from "./markdown2html.js"
import { getProblem } from "./problem.js"

class Contest {
    id = 1
    title
    begintime = new Date().getTime()
    endtime = new Date().getTime()
    author = `cn_ryh`
    type = `OI`
    problems = []
    description
}
/**
 * 
 * @returns {Promise<Contest>}
 */
function getContestList() {
    return new Promise((resolve, reject) => {
        const SQL = `select * from contests`
        backendData.query(SQL).then((res) => {
            resolve(res.rows);
        }).catch((err) => {
            console.error(err);
            reject();
        })
    })
}
function newContest(req, res) {
    backendData.query(`select max(id) from contests`).then((mx) => {
        if (!mx.rows[0].max) {
            mx.rows[0] = { max: 0 };
        }
        let id = Number(mx.rows[0].max) + 1;
        let SQL = `insert into contests (id,title,description,author,problems,begintime,endtime)
        VALUES
        (
            ${id},
            '${req.body.title}',
            E'${req.body.description.replace(/\\/g, '\\\\').replace(/\r\n/g, '\n').replace(/\n/g, '\\n').replace(/"/g, '\\"').replace(/'/g, '\\\'')}',
            'cn_ryh',
            '${JSON.stringify(req.body.problems)}'::json,
            TO_TIMESTAMP(${req.body.begintime} + 28000),
            TO_TIMESTAMP(${req.body.endtime} + 28800)
        );
        `;
        backendData.query(SQL).then(() => {
            res.status(200).send({ success: true });
        }).catch((err) => {
            console.error(err);
        })
    })
}
function getContest(req, res) {
    const id = req.params.id;
    backendData.query(`select * from contests where id=${id}`).then(async (contestRow) => {
        if (contestRow.rowCount !== 1) {
            res.status(404).send(`NOT FOUND`);
            return;
        }
        contestRow.rows[0].descriptionmd = contestRow.rows[0].description;
        contestRow.rows[0].description = MarkDown2HTML(contestRow.rows[0].description);
        let newProblems = [];

        for (let now of contestRow.rows[0].problems) {
            let x = await getProblem(now.problem);
            x.description = undefined;
            newProblems.push(x);
        }
        contestRow.rows[0].problems = newProblems;
        res.status(200).send(contestRow.rows[0]);
    })
}

function changeContest(req, res) {
    const title = req.body.title
    const description = req.body.description.replace(/\\/g, '\\\\').replace(/\r\n/g, '\n').replace(/\n/g, '\\n').replace(/"/g, '\\"').replace(/'/g, '\\\'')
    const begintime = req.body.begintime
    const endtime = req.body.endtime
    const problems = req.body.problems
    const id = req.params.id
    const SQL = `update contests set 
    "title"='${title}',
    "description"='${description}',
    "begintime"=to_timestamp(${begintime ?? 0 + 28800}),
    "endtime"=to_timestamp(${endtime ?? 0 + 28800} ),
    "problems"='${JSON.stringify(problems)}'::json
    where id=${id};`
    console.log(SQL);
    backendData.query(SQL).then(() => {
        res.status(200).send({ success: true });
    }).catch((err) => {
        console.error(err);
    })
}
export { getContestList, newContest, getContest, changeContest }