import { existsSync, rename, renameSync, unlink } from "fs";
import * as multiparty from "multiparty";
import backendData from "./database.js";
import { translateFileSize } from "./unit.js";
import { extname } from "path";
function uploadFiles(req, res) {
    let form = new multiparty.Form({ uploadDir: './files' })
    form.parse(req, (err, fields, file) => {
        if (err) {
            console.error('parse error: ' + err);
        }
        else {
            let SQL = `select max(id) from files`;
            backendData.query(SQL).then((mx) => {
                if (!mx.rows[0].max) {
                    mx.rows[0] = { max: 0 };
                }
                const id = Number(mx.rows[0].max) + 1;
                let inputFile = file.file[0];
                let uploadedPath = inputFile.path;
                let realname = inputFile.originalFilename;
                let extname = realname.substring(realname.lastIndexOf('.') + 1);
                let dstPath = `./files/${id}.${extname}`;
                //重命名为真实文件名
                rename(uploadedPath, dstPath, function (err) {
                    if (err) {
                        res.status(200).send({
                            successUpload: false
                        })
                    } else {
                        const uploadDate = new Date();
                        SQL = `insert into files (id,filename,uploadtime,filesize,downloadtime) VALUES
(
    ${id},
    '${realname}',
    '${uploadDate.getFullYear()} 年 ${uploadDate.getMonth()} 月 ${uploadDate.getDay()} 日 ${uploadDate.getHours()}:${uploadDate.getMinutes()}:${uploadDate.getSeconds()}',
    '${translateFileSize(inputFile.size)}',
    0
)`
                        backendData.query(SQL).then(() => {
                            res.status(200).send({
                                successUpload: true
                            })
                        }).catch((err) => {
                            console.error(err);
                            res.status(200).send({
                                successUpload: false
                            })
                        })
                    }
                });
            })

        }
    }
    )
}

function getFileList(req, res) {
    const SQL = `select * from files`
    backendData.query(SQL).then((files) => {
        res.status(200).send(files.rows);
    })
}
function downloadFile(req, res) {
    const fileid = req.params.fileid;
    let SQL = `select id,filename,downloadtime from files where id=${fileid}`
    backendData.query(SQL).then((fileinfo) => {
        let file = fileinfo.rows[0];
        let filename = file.filename;
        let extname = filename.substring(filename.lastIndexOf('.') + 1);
        if (existsSync(`./files/${fileid}.${extname}`)) {
            res.status(200).download(`./files/${fileid}.${extname}`);
            SQL = `update files downloadtime=${Number(file.downloadtime) + 1} where id=${fileid}`
            backendData.query(SQL).catch((err) => {
                console.error(err);
                return;
            })
        }
        else {
            res.status(404).send("Not Found");
        }
    })
}
export { uploadFiles, getFileList, downloadFile }