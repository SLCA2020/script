// const data = []

// let str = ''

// // 提取账号密码
// data.map(item=>{
//   const t = `${item[0].username},${item[0].password}\n`

//   str += t
// })

// console.log(str)

// 生成uuid
// const uuid = () => {
//   let d = new Date().getTime();
//   const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
//       /[xy]/g,
//       (c) => {
//           const r = (d + Math.random() * 16) % 16 | 0;
//           d = Math.floor(d / 16);
//           return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
//       }
//   );
//   return uuid;
// };
// const id = uuid();
// console.log(id);

// 提取 telegram 消息中的账号密码
const data = [];
for (let i = 0; i < data.length; i++) {
    const text = data[i].text;
    const str = text[0] + text[1].text + text[2];
    try {
        let obj = JSON.parse(str);
        if (obj[0].is_plus) {
            console.log(obj[0].username + "," + obj[0].password);
        }
    } catch (error) {
        console.log("error" + str);
    }
}
