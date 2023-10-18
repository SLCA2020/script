/*
通过 refreshToken 刷新 FK
*/

const got = require("got");
const fs = require("fs");
const path = require("path");

const resultPath = path.join(__dirname, "result.txt");
const authJsonPath = path.join(__dirname, "auth.json");

const refreshtokenList = JSON.parse(fs.readFileSync(authJsonPath)); // 读取 auth.json 文件

let resStr = "";
let currentRefreshtoken = "";

//脚本入口函数main()
async function main() {
    for (let index = 0; index < refreshtokenList.length; index++) {
        const item = refreshtokenList[index];
        currentRefreshtoken = item.refresh_token;

        resStr += `${item.email},${item.password}\n`;

        //开始账号任务
        await refreshToken(currentRefreshtoken, index + 1, item.email);
    }

    fs.writeFileSync(resultPath, resStr); // 存储结果
    console.log(`\n最终结果已生成在 result.txt\n`);
}

// 刷新Token接口
async function refreshToken(token, index, email) {
    console.log(`开始刷新账号[${index}]: ${email}`);
    try {
        let urlObject = {
            fn: "/auth/refresh",
            method: "post",
            url: "https://ai.fakeopen.com/auth/refresh",
            form: {
                refresh_token: token,
            },
            //超时设置
            timeout: 15000,
        };

        const { result } = await request(urlObject);

        if (result.access_token && result.access_token !== "") {
            await tokenRegister(result.access_token, index);
        } else {
            console.log(`账号[${index}]\n${JSON.stringify(result)}`);
        }
    } catch (e) {
        //打印错误信息
        console.log(e);

        resStr += `${e}\n\n`;
    }
}

// 注册或更新 Share Token
async function tokenRegister(accessToken, index) {
    try {
        let urlObject = {
            fn: "/token/register",
            method: "post",
            url: "https://ai.fakeopen.com/token/register",
            form: {
                unique_name: "slca",
                access_token: accessToken,
                expires_in: 0,
                show_conversations: false,
                show_userinfo: false,
            },
            //超时设置
            timeout: 15000,
        };

        const { result } = await request(urlObject);

        if (result.token_key && result.token_key !== "") {
            resStr += `${result.token_key}\n`;
            resStr += `${currentRefreshtoken}\n\n`;
            console.log(`账号[${index}]成功`);
        } else {
            console.log(`账号[${index}]\n${JSON.stringify(result)}`);
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
    }
}

//调用main()
main();

//got的基本用法, 封装一下方便之后直接调用
async function request(opt) {
    const DEFAULT_RETRY = 3; //请求出错重试三次
    var resp = null,
        count = 0;
    var fn = opt.fn || opt.url;
    opt.method = opt?.method?.toUpperCase() || "GET";
    while (count++ < DEFAULT_RETRY) {
        try {
            var err = null;
            const errcodes = [
                "ECONNRESET",
                "EADDRINUSE",
                "ENOTFOUND",
                "EAI_AGAIN",
            ];
            await got(opt).then(
                (t) => {
                    resp = t;
                },
                (e) => {
                    err = e;
                    resp = e.response;
                }
            );
            if (err) {
                if (err.name == "TimeoutError") {
                    console.log(
                        `[${fn}]请求超时(${err.code})，重试第${count}次`
                    );
                } else if (errcodes.includes(err.code)) {
                    console.log(
                        `[${fn}]请求错误(${err.code})，重试第${count}次`
                    );
                } else {
                    let statusCode = resp?.statusCode || -1;
                    console.log(
                        `[${fn}]请求错误(${err.message}), 返回[${statusCode}]`
                    );
                    break;
                }
            } else {
                break;
            }
        } catch (e) {
            console.log(`[${fn}]请求错误(${e.message})，重试第${count}次`);
        }
    }
    let { statusCode = -1, headers = null, body = null } = resp;
    if (body)
        try {
            body = JSON.parse(body);
        } catch {}
    return { statusCode, headers, result: body };
}
