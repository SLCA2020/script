const fs = require("fs");
const path = require("path");

const resultPath = path.join(__dirname, "result.json");

const authPath = path.join(__dirname, "credentials.txt");
const authList = fs
    .readFileSync(authPath, "utf8")
    .split("\r\n")
    .filter((line) => {
        return line !== "";
    });

let resJSON = [];

// 循环 authList 每三项为一组，分别为 username, password, refresh_token
for (let index = 0; index < authList.length; index += 3) {
    const username = authList[index].split(",")[0];
    const password = authList[index].split(",")[1];
    const fk_token = authList[index + 1];
    const session_token = authList[index + 2];

    // 生成结果
    const resItem = {
        username,
        password,
        refresh_token: "",
        session_token,
        fk_token: "",
        login_time: "",
    };

    resJSON.push(JSON.parse(JSON.stringify(resItem)));
}

fs.writeFileSync(resultPath, JSON.stringify(resJSON)); // 存储结果
