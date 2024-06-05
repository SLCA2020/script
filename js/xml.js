const fs = require('fs');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

// 读取 XML 文件
const xml = fs.readFileSync('./xmlfile.xml', 'utf-8');

// 定义要查找的路径
const paths = fs.readFileSync('./xmlpath.txt', 'utf-8').split('\r\n');

// 函数：将路径转换为 XPath 表达式
function convertToXPath(path) {
  return '/' + path.split('.').map(segment => {
    // 检查是否为纯数字，如果是则转换为带 keyid 的格式
    const isNumber = /^\d+$/.test(segment);
    return isNumber ? `*[${segment}]` : segment;
  }).join('/');
}

// 解析 XML 并查找路径对应的值
const doc = new dom().parseFromString(xml);

// const results = {};
let results = '';
paths.forEach(path => {
  const xpathExpression = convertToXPath(path);

  // try {
  //   const nodes = xpath.select(xpathExpression.split('/*').join(''), doc);
  //   results[path] = nodes.length > 0 ? nodes[0].textContent : '';
  // } catch (error) {
  //   console.error(`Error processing XPath expression "${xpathExpression}":`, error.message);
  //   results[path] = '';
  // }

  try {
    const nodes = xpath.select(xpathExpression.split('/*').join(''), doc);
    results += (nodes.length > 0 ? nodes[0].textContent : '') + '\r\n'
  } catch (error) {
    console.error(`Error processing XPath expression "${xpathExpression}":`, error.message);
    results += '\r\n'
  }
});

// 将 values 存储到 json 文件
// fs.writeFileSync('./xmlResult.json', JSON.stringify(results, null, 2), 'utf-8');
fs.writeFileSync('./xmlResult.json', results, 'utf-8');

console.log('Values have been saved to xmlResult.json');
