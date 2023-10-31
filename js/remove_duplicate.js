const fs = require("fs");
const path = require("path");

const resultPath = path.join(__dirname, "result.json");
const authJsonPath = path.join(__dirname, "auth.json");
const refreshtokenList = JSON.parse(fs.readFileSync(authJsonPath)); // 读取 auth.json 文件

// 对读取到的 auth.json 文件进行去重, 并将去重后的结果写入 result.json 文件
fs.writeFileSync(
    resultPath,
    JSON.stringify(
        refreshtokenList.filter(
            (item, index, arr) =>
                arr.findIndex((v) => v.username === item.username) === index
        )
    )
);
