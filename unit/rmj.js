import { randomInt } from "crypto";
import { appendFileSync, readFileSync, writeFileSync } from "fs";
import puppeteer from "puppeteer";
async function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
async function main() {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/opt/google/chrome/chrome'
    }
    );
    const page = await browser.newPage();
    await page.setCookie(
        {
            url: "https://www.luogu.com.cn",
            name: "__client_id",
            value: "4485f1f661f9ff2393c90fb315c368cc872fc464"
        }, {
        url: "https://www.luogu.com.cn",
        name: "_uid"
        , value: "458193"
    })
    await page.setUserAgent(`Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0`)
    // page.setDefaultTimeout(10000);
    // page.setDefaultNavigationTimeout(10000);
    async function isSolutionOpen(pid) {
        if (page.url() != `https://www.luogu.com.cn/problem/solution/${pid}`) {
            try {
                await page.goto(`https://www.luogu.com.cn/problem/solution/${pid}`)
            } catch (err) {
                console.error(err);
            }
        }
        try {
            await page.waitForSelector(`.operation`)
            // await page.waitForNavigation();
            // await page.waitForNetworkIdle();
        } catch (err) {
            console.error(err);
        };
        return (await page.evaluate(() => {
            if (document.getElementsByClassName(`operation`)[0].childElementCount == 2) {
                return true;
            }
            else {
                return false;
            }
        }))
    }
    async function getSolutionNum(pid) {
        if (page.url() != `https://www.luogu.com.cn/problem/solution/${pid}`) {
            try {
                await page.goto(`https://www.luogu.com.cn/problem/solution/${pid}`)
            } catch (err) {
                console.error(err);
            }
        }
        try {
            await page.waitForSelector(`.card-header`)
        } catch (err) {
            console.error(err);
        };
        return (await page.evaluate(
            () => {
                return Number(document.getElementsByClassName(`main`)[0].getElementsByClassName(`card-header`)[0].firstElementChild.innerText.split(` `)[0])
            }))
    }
    async function getDiff(pid) {
        try {
            page.goto(`https://www.luogu.com.cn/problem/${pid}`)
        } catch (err) {
            console.error(err);
        }
        try {
            await page.waitForSelector(`.info-rows`);
        } catch (error) {
            console.error(err);
        }

        while (await page.evaluate(() => {
            const info = document.getElementsByClassName(`info-rows`)[0]
            if (info == null || info == undefined) {
                return true
            }
            if (/difficulty=/.test(info.innerHTML)) {
                return false;
            }
            return true;
        })) { }
        // await sleep(1000)
        return (await page.evaluate(
            () => {
                const info = document.getElementsByClassName(`info-rows`)[0]
                return Number(info.innerHTML.match(/difficulty=([0-9])/)[1])
                // return +(info.children[1].children[1].firstElementChild.href.split(`=`)[1])
            }))
    }
    async function getProblemsOfPage(pageId, type) {
        await page.goto(`https://www.luogu.com.cn/problem/list?type=${type}&page=${pageId}`)
        await page.waitForNetworkIdle();
        return await page.evaluate(() => {
            const list = document.getElementsByClassName("row");
            const len = list.length;
            const problems = [];
            for (let idx = 0; idx < len; idx++) {
                const now = list[idx];
                problems.push(now.getElementsByClassName(`title`)[0].firstElementChild.href.split('https://www.luogu.com.cn/problem/')[1]);
            }
            return problems
        })
    }
    async function getAllProblemsSync() {
        const ProblemTypes = ['P', 'CF', 'AT']
        let problems = []

        for (let type of ProblemTypes) {
            await page.goto(`https://www.luogu.com.cn/problem/list?type=${type}`)
            await page.waitForNetworkIdle();
            const totPages = await page.evaluate(() => { return document.getElementsByClassName(`total`)[0].firstElementChild.innerHTML });
            for (var i = 1; i <= totPages; i++) {
                await sleep(100 + randomInt(20, 30));
                problems = problems.concat(await getProblemsOfPage(i, type));
                // problems.join((await getProblemsOfPage(i)).toString());
            }
            await sleep(100);
        }
        return problems;
    }
    async function addListen(pid, lim = -1) {
        // 已经关闭了，返回 -1
        if ((await isSolutionOpen(pid)) === false) {
            return -1;
        }
        // 没有给最大值参数
        if (lim === -1) {

        }
    }
    function sortby(prop, rev = true) {
        // prop 属性名
        // rev  升序降序 默认升序
        return function (a, b) {
            var val1 = a[prop];
            var val2 = b[prop];
            return rev ? val1 - val2 : val2 - val1;
        }
    }
    async function resolveAll(resolveDiff = false) {
        let problems = JSON.parse(readFileSync(`./nxt.json`, "utf-8"));        // const problems = await getAllProblems();
        await problems.sort(function (a, b) {
            // return (a.mx < b.mx);
            if(a.pid[0] == 'P')
            {
                if(b.pid[0] == 'P')
                {
                    if(a.cnt == b.cnt)
                    {
                        return (a.pid.split('P')[1] < b.pid.split('P')[1])?(-1):(1);
                    }
                    else
                    {
                    return ((a.cnt) < (b.cnt)) ? (-1) : (1);

                    }
                }
                else
                {
                    return -1;
                }
            }
            else
            {
                if(b.pid[0] == 'P')
                {
                    return 1;
                }
                else
                {
                    return ((a.cnt) < (b.cnt)) ? (-1) : (1);

                }
            }
        });
        await sleep(1000);
        for (let cnt = 0; cnt < problems.length; cnt++) {
            let now = problems[cnt]
            const id = now.pid;
            let open, diff, num;
            await sleep(748);
            if (resolveDiff || now.col == undefined || now.col === "undefined") {
                try {
                    diff = await getDiff(id)
                }
                catch (err) {
                    console.error(err)
                }
                await sleep(312);
            }
            else {
                diff = diffnum[now.col];
            }
            try {
                open = await isSolutionOpen(id)
            } catch (err) {
                console.error(err);
                return;
            }
            if (!open) {
                problems.splice(cnt, 1);
                --cnt;
                continue;
            }
            try {
                num = await getSolutionNum(id)
            } catch (err) {
                console.error(err);
            }
            let mx = 0;
            if (now.mx == undefined || now.mx == -1) {
                mx = maxCount[diff]
            }
            else {
                mx = now.mx;
            }
            problems[cnt] =
            {
                pid: id,
                col: diffCol[diff],
                cnt: num,
                mx: mx
            }
            if (num >= mx) {
                appendFileSync(`./needClose.json`,
                    `,"${now}":{
                    "col":"${diffCol[diff]}",
                    "cnt": ${num}
                }
            `)
                problems.splice(cnt, 1);
                --cnt;
            }
            let s = JSON.stringify(problems);
            s = s.replace(/ /g, '');
            s = s.replace(/\n/g, '');
            s = s.replace(/,(?!\{)/g, ',\n\t\t');
            s = s.replace(/\},\{/g, '\n\t},\n\t{\n\t\t')
            writeFileSync(`nxt.json`, s, "utf-8");
        };


    }
    await resolveAll();
    // writeFileSync('needColse.txt', nedColse.toString(), 'utf-8');
    // writeFileSync('nxt.txt', nxtProblems.toString(), 'utf-8');
    browser.close();
}



await main();