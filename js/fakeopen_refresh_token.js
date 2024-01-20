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

//脚本入口函数main()
async function main() {
    // 打印账号数量
    console.log(`账号数量: ${refreshtokenList.length}\n`);
    for (let index = 0; index < refreshtokenList.length; index++) {
        // 账号信息格式解析
        const { username, password, refresh_token, session_token } =
            refreshtokenList[index];

        // 群消息格式解析
        // const { refresh_token, session_token } = JSON.parse(
        //     refreshtokenList[index].text
        // );
        // const username = index + 1,
        //     password = index + 1;

        if (!refresh_token && !session_token) {
            console.log(`账号[${index + 1}]无 refresh_token 或 session_token`);
            continue;
        }

        resJSON[index] = {
            username: username,
            password: password,
            refresh_token: refresh_token,
            session_token: session_token,
            access_token: "",
            fk_token: "",
            login_time: new Date().toLocaleString(),
        };

        // 判断是否有 refresh_token
        if (refresh_token && refresh_token !== "") {
            //开始账号任务
            await refreshToken(refresh_token, index + 1, username, password);
        } else {
            //开始账号任务
            await refreshTokenBySession(
                session_token,
                index + 1,
                username,
                password
            );
        }
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
async function refreshToken(token, index, email, password) {
    console.log(`开始刷新账号[${index}]: ${email},${password}`);
    try {
        let urlObject = {
            fn: "/auth/refresh",
            method: "post",
            url: "http://localhost:8181/e2a5dd9c-d1cf-462b-a032-c0e808425d8a/api/auth/refresh",
            form: {
                refresh_token: token,
            },
            //超时设置
            timeout: 15000,
        };

        const { result } = await request(urlObject);

        if (result.access_token && result.access_token !== "") {
            resJSON[index - 1].access_token = result.access_token;
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
async function refreshTokenBySession(token, index, email, password) {
    console.log(`开始刷新账号[${index}]: ${email},${password}`);
    try {
        let urlObject = {
            fn: "/auth/session",
            method: "post",
            url: "http://localhost:8181/e2a5dd9c-d1cf-462b-a032-c0e808425d8a/api/auth/session",
            form: {
                session_token: token,
            },
            //超时设置
            timeout: 15000,
        };

        const { result } = await request(urlObject);

        if (result.access_token && result.access_token !== "") {
            resJSON[index - 1].access_token = result.access_token;
            resJSON[index - 1].session_token = result.session_token || "";
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
    // 判断是否有 GPT-4 模型
    if (!(await getModels(accessToken, index))) {
        return;
    }

    try {
        let urlObject = {
            fn: "/token/register",
            method: "post",
            url: "http://localhost:8181/e2a5dd9c-d1cf-462b-a032-c0e808425d8a/api/token/register",
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
            resJSON[index - 1].fk_token = result.token_key;
            console.log(`账号[${index}]成功`);
        } else {
            console.log(`账号[${index}]\n${JSON.stringify(result)}`);
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
    }
}

// 列出账号可用的模型并判断是否有 GPT-4 模型
async function getModels(accessToken, index) {
    console.log(`开始获取账号[${index}]可用的模型`);
    try {
        let urlObject = {
            fn: "/api/models",
            method: "get",
            url: "http://localhost:8181/e2a5dd9c-d1cf-462b-a032-c0e808425d8a/backend-api/models",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            //超时设置
            timeout: 15000,
        };

        const { result } = await request(urlObject);

        // 判断是否有 GPT-4 模型
        if (result.models) {
            if (result.models.some((model) => model.slug === "gpt-4")) {
                console.log(`账号[${index}] GPT-4 true`);
                return true;
            } else {
                console.log(`账号[${index}] GPT-4 false`);
            }
        } else {
            console.log(`账号[${index}]\n${JSON.stringify(result)}`);
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
    }

    return false;
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
