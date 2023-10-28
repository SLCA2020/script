/*
通过 refreshToken 刷新 FK
*/

const got = require("got");
const fs = require("fs");
const path = require("path");

const resultPath = path.join(__dirname, "result.json");
const resultErrPath = path.join(__dirname, "result_err.json");
const authJsonPath = path.join(__dirname, "auth.json");
const refreshtokenList = JSON.parse(fs.readFileSync(authJsonPath)); // 读取 auth.json 文件

let resJSON = [];
let resItem = {
    username: "",
    password: "",
    refresh_token: "",
    session_token: "",
    access_token: "",
    fk_token: "",
    login_time: "",
};

//脚本入口函数main()
async function main() {
    for (let index = 0; index < refreshtokenList.length; index++) {
        const { username, password, refresh_token, session_token } =
            refreshtokenList[index];

        resItem.username = username;
        resItem.password = password;
        resItem.refresh_token = refresh_token;
        resItem.session_token = "";
        resItem.access_token = "";
        resItem.fk_token = "";
        resItem.login_time = new Date().toLocaleString();

        // 判断是否有 refresh_token
        if (refresh_token && refresh_token !== "") {
            //开始账号任务
            await refreshToken(refresh_token, index + 1, username);
        } else {
            //开始账号任务
            await refreshTokenBySession(session_token, index + 1, username);
        }

        resJSON.push(JSON.parse(JSON.stringify(resItem)));
    }

    fs.writeFileSync(
        resultPath,
        JSON.stringify(resJSON.filter((item) => item.fk_token !== ""))
    ); // 存储结果
    fs.writeFileSync(
        resultErrPath,
        JSON.stringify(resJSON.filter((item) => item.fk_token === ""))
    ); // 存储结果
    console.log(`\n最终结果已生成在 result.json\n`);
}

// 刷新Token接口通过 refresh_token
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
            resItem.access_token = result.access_token || "";
            await tokenRegister(result.access_token, index);
        } else {
            console.log(`账号[${index}]\n${JSON.stringify(result)}`);
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
    }
}

// 刷新Token接口通过 session_token
async function refreshTokenBySession(token, index, email) {
    console.log(`开始刷新账号[${index}]: ${email}`);
    try {
        let urlObject = {
            fn: "/auth/session",
            method: "post",
            url: "https://ai.fakeopen.com/auth/session",
            form: {
                session_token: token,
            },
            //超时设置
            timeout: 15000,
        };

        const { result } = await request(urlObject);

        if (result.access_token && result.access_token !== "") {
            resItem.access_token = result.access_token || "";
            resItem.session_token = result.session_token || "";
            await tokenRegister(result.access_token, index);
        } else {
            console.log(`账号[${index}]\n${JSON.stringify(result)}`);
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
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
            resItem.fk_token = result.token_key;
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
