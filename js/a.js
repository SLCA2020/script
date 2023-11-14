const data = []

let str = ''

// 通过 username 对 data 去重，并返回去重后的数组
function unique(arr) {
  const res = new Map()
  return arr.filter((a) => !res.has(a[0].username) && res.set(a[0].username, 1))
}

const arr = unique(data)

// 提取账号密码
data.map(item=>{
  const t = `${item[0].username},${item[0].password}\n`

  str += t
})

console.log(str)
