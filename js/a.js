const data = []

let str = ''

// 提取账号密码
data.map(item=>{
  const t = `${item[0].username},${item[0].password}\n`

  str += t
})

console.log(str)
