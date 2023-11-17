/*
生成 tokens.json 文件
*/

const fs = require("fs");
const path = require("path");

const tokenPath = path.join(__dirname, "tokens.json");
const authJsonPath = path.join(__dirname, "auth.json");
const refreshtokenList = JSON.parse(fs.readFileSync(authJsonPath)); // 读取 auth.json 文件

let tokenJson = {};

for (let i = 0; i < refreshtokenList.length; i++) {
    const { refresh_token, session_token } = refreshtokenList[i];

    tokenJson["s" + (i + 1)] = {
        // refresh_token 是否为空，为空则使用 session_token
        token: refresh_token || session_token,
        shared: true,
        show_user_info: false,
        plus: true,
    };
}

fs.writeFileSync(tokenPath, JSON.stringify(tokenJson));
