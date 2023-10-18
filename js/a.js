const data = []

let str = ''
// data.map(item=>{
//   const t = `
//     ${item.email}----${item.password}
//     refresh_token:${item.refresh_token}
//     fk_token(qwqsun):
//   `

//   str += t
// })

// 提取账号密码
data.map(item=>{
  const t = `${item[0].username},${item[0].password}\n`

  str += t
})

console.log(str)

// // 对 data 去重
// const arr = []
// data.map(item=>{
//   if(!arr.includes(item)){
//     arr.push(item)
//   }
// })

// console.log(arr)
