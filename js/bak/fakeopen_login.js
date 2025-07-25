/*
登录并获取 FK
*/

const got = require("got");
const fs = require("fs");
const path = require("path");

const resultPath = path.join(__dirname, "result.json");
const resultErrPath = path.join(__dirname, "result_err.json");

const authPath = path.join(__dirname, "credentials.txt");
const authList = fs
    .readFileSync(authPath, "utf8")
    .split("\r\n")
    .map((line) => {
        return { username: line.split(",")[0], password: line.split(",")[1] };
    });

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
    // 打印账号数量
    console.log(`账号数量: ${authList.length}\n`);
    for (let index = 0; index < authList.length; index++) {
        const item = authList[index];

        resItem.username = item.username;
        resItem.password = item.password;
        resItem.refresh_token = "";
        resItem.session_token = "";
        resItem.access_token = "";
        resItem.fk_token = "";
        resItem.login_time = new Date().toLocaleString();

        //开始账号任务
        await login(item, index + 1);

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

// 登录接口
async function login({ username, password }, index) {
    console.log(`开始登录账号[${index}]: ${username},${password}`);
    try {
        let urlObject = {
            fn: "/auth/login",
            method: "post",
            url: "http://localhost:8181/e2a5dd9c-d1cf-462b-a032-c0e808425d8a/api/auth/login",
            form: {
                username,
                password,
            },
            //超时设置
            timeout: 15000,
        };

        const { result } = await request(urlObject);

        if (result.access_token && result.access_token !== "") {
            resItem.access_token = result.access_token;
            resItem.refresh_token = result.refresh_token || "";
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
