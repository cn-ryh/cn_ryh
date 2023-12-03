import { createTransport } from 'nodemailer';
import { resolve } from 'path';
class emailFile {
    name = ``;
    file = ``;
    constructor(name, file) {
        this.name = name;
        this.file = file;
    }
}
class emailContent {
    subject = ``;
    text = ``;
    html = ``;
    constructor(subject = ``, text = ``, html = ``) {
        this.subject = subject;
        this.text = text;
        this.html = html;
    }
}
class emailPrama {
    userAccount = `a18844172552@163.com`;
    pass = `JZAUYLIOAOGLRPBV`;
    to = ``;
    parames = new emailContent()
    /**
     * 
     * @param {emailPrama} initemailPrama 
     */
    constructor(initemailPrama) {
        for (var now in initemailPrama) {
            this[now] = initemailPrama[now]
        }
    }
}

function sendMail({
    userAccount,
    pass,
    to,
    params = new emailContent(),
    files = []
}) {
    if (!userAccount || !pass) {
        throw new Error('个人邮箱账号或邮箱授权码不能为空')
    }
    if (!to) {
        throw new Error('邮件接收者邮箱账号不能为空')
    }
    if (!params || (params.subject == undefined && params.text == undefined && params.html == undefined)) {
        throw new Error('邮件内容信息不能为空')
    }

    var transporter = createTransport({
        // 邮箱服务的host: qq: smtp.qq.com; 163: smtp.163.com
        host: 'smtp.163.com',
        // 开启安全连接，这个开不开都可以，对安全性有要求的话，最好开启
        secureConnection: true,
        // SMTP协议端口号
        port: 465,
        auth: {
            user: userAccount,
            pass: pass,
        },
        tls: {
            rejectUnauthorized: false, // 拒绝认证就行了， 不然会报证书问题
        },
    });
    // 配置发送内容
    var mailOptions = {
        // 发件人邮箱
        from: userAccount,
        // 收件人邮箱, 多个邮箱地址用逗号隔开
        to: to,
        // 邮件主题
        subject: params.subject,
        // 文字内容
        text: params.text,
        // html内容
        html: params.html,
        // 附件
        attachments: files
    }
    // 发送邮件
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log('发送错误:' + err);
        } else {
            console.log('邮件发送:' + info.response);
        }
    });
}

export { sendMail, emailPrama, emailContent,emailFile }
