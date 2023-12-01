// const data = []

// let str = ''

// // 提取账号密码
// data.map(item=>{
//   const t = `${item[0].username},${item[0].password}\n`

//   str += t
// })

// console.log(str)

// 生成uuid
const uuid = () => {
  let d = new Date().getTime();
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (c) => {
          const r = (d + Math.random() * 16) % 16 | 0;
          d = Math.floor(d / 16);
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
  );
  return uuid;
};
// 生成唯一id
const id = uuid();
console.log(id);
