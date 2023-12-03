import backendData from "./database";
import { getUser } from "./user";

class Blog {
    id = 0;
    title = ``;
    author = ``;
    description = ``;
    context = ``;
    constructor(initBlog = new Blog()) {
        for (let now in initBlog) {
            this[now] = initBlog[now];
        }
    }
}

function createBlog(req, res) {
    const uid = req.body.uid;
    const title = req.body.title;
    const description = req.body.description;
    const text = req.body.text;
    getUser(uid).then((user) => {
        const username = user.username;
        let SQL = `select max(id) from blogs`
        backendData.query(SQL).then((mx) => {
            if (!mx.rows[0].max) {
                mx.rows[0] = { max: 0 };
            }
            const id = mx.rows[0].max + 1;
            SQL = `insert into blogs (id,title,author,context) VALUES
            (
                ${id},
                '${title}',
                '${username}',
                '${context}'
            );`
            backendData.query(SQL).then(() => {
                res.status(200).send(id);
            }).catch((err)=>
            {
                res.status(200).send(null);
            })
        })
    })
}
function getBlog(req,res)
{
    
}

function editBlog(req,res)
{

}