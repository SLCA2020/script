/*
刷新ChatGPT账号

下面一行是建议定时,青龙拉库会自动读取
cron: 24 8,22 * * *
*/

const $ = new Env('刷新ChatGPT账号'); //青龙拉库会把 new Env('qwerty') 里面的名字qwerty作为定时任务名
const got = require('got'); //青龙发包依赖
const fs = require('fs');
const path = require('path');

const recordFilePath = path.join(__dirname, 'RF_lastExecuted.txt');

const env_name = 'chatgptRefreshToken'
const env = '1BLnIgEIVqcqPrF842jBJxG2BROrOvqnmKyTUVA9sTmnf'
let tokenList = []

//脚本入口函数main()
async function main() {
    if(env == '') {
        //没有设置变量,直接退出
        console.log(`没有填写变量: ${env_name}`);
        return;
    }

    let user_ck = env.split('\n');

    console.log(`\n============= 开始刷新 Token =============`)
    for (let index = 0; index < user_ck.length; index++) {
        const ck = user_ck[index]

        if(!ck) continue; //跳过空行

        let user = {
            index: index + 1,
            userid: ck
        };

        //开始账号任务
        await refreshToken(user);
    }

    fs.writeFileSync(recordFilePath, new Date().toISOString()); // 存储当前执行的时间
}

// 刷新Token接口
async function refreshToken(user) {
    try {
        let urlObject = {
            fn: '/auth/refresh',
            method: 'post',
            url: 'https://token.oaifree.com/api/auth/refresh',
            form: {
                refresh_token: user.userid
            },
            //超时设置
            timeout: 15000,
        }

        const {result} = await request(urlObject);

        if (result.access_token && result.access_token !== '') {
            console.log(`账号[${user.index}]获取 Token 成功`)
            await tokenRegister(result.access_token,user.index)
        } else {
            console.log(`账号[${user.index}]\n${JSON.stringify(result)}`)
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
    }
}

// 注册或更新 Share Token
async function tokenRegister(token,index) {
    try {
        let urlObject = {
            fn: '/token/register',
            method: 'post',
            url: 'https://chat.oaifree.com/token/register',
            form: {
                "unique_name": "slca",
                "access_token": token,
                "expires_in": 0,
                "show_userinfo": false,
                "site_limit": "",
                "gpt35_limit": -1,
                "gpt4_limit": -1,
                "show_conversations": true,
                "temporary_chat": false,
                "reset_limit": false
            },
            //超时设置
            timeout: 15000,
        }

        const {result} = await request(urlObject);

        if (result.token_key && result.token_key !== '') {
            console.log(`账号[${index}]: ${result.token_key}`)
        } else {
            console.log(`账号[${index}]\n${JSON.stringify(result)}`)
        }
    } catch (e) {
        //打印错误信息
        console.log(e);
    }
}

//调用main()
main();

//got的基本用法, 封装一下方便之后直接调用, 新手可以不动他直接用就行
//got的基本用法, 封装一下方便之后直接调用, 新手可以不动他直接用就行
async function request(opt) {
    const DEFAULT_RETRY = 3; //请求出错重试三次
    var resp = null, count = 0;
    var fn = opt.fn || opt.url;
    opt.method = opt?.method?.toUpperCase() || 'GET';
    while (count++ < DEFAULT_RETRY) {
        try {
            var err = null;
            const errcodes = ['ECONNRESET', 'EADDRINUSE', 'ENOTFOUND', 'EAI_AGAIN'];
            await got(opt).then(t => {
                resp = t
            }, e => {
                err = e;
                resp = e.response;
            });
            if(err) {
                if(err.name == 'TimeoutError') {
                    console.log(`[${fn}]请求超时(${err.code})，重试第${count}次`);
                } else if(errcodes.includes(err.code)) {
                    console.log(`[${fn}]请求错误(${err.code})，重试第${count}次`);
                } else {
                    let statusCode = resp?.statusCode || -1;
                    console.log(`[${fn}]请求错误(${err.message}), 返回[${statusCode}]`);
                    break;
                }
            } else {
                break;
            }
        } catch (e) {
            console.log(`[${fn}]请求错误(${e.message})，重试第${count}次`);
        };
    }
    let {statusCode=-1,headers=null,body=null} = resp;
    if (body) try {body = JSON.parse(body);} catch {};
    return {statusCode,headers,result:body};
}

function Env(name) {
    return new class {
        constructor(name) {
            this.name = name;
            this.startTime = Date.now();
            this.log(`[${this.name}]开始运行\n`, {time: true});
            this.notifyStr = [];
            this.notifyFlag = true;
            this.userIdx = 0;
            this.userList = [];
            this.userCount = 0;
        }
        log(msg, options = {}) {
            let opt = {console: true};
            Object.assign(opt, options);
            if (opt.time) {
                let fmt = opt.fmt || 'hh:mm:ss';
                msg = `[${this.time(fmt)}]` + msg;
            }
            if (opt.notify) this.notifyStr.push(msg);
            if (opt.console) console.log(msg);
        }
        read_env(Class) {
            let envStrList = ckNames.map(x => process.env[x]);
            for (let env_str of envStrList.filter(x => !!x)) {
                let sp = envSplitor.filter(x => env_str.includes(x));
                let splitor = sp.length > 0 ? sp[0] : envSplitor[0];
                for (let ck of env_str.split(splitor).filter(x => !!x)) {
                    this.userList.push(new Class(ck));
                }
            }
            this.userCount = this.userList.length;
            if (!this.userCount) {
                this.log(`未找到变量，请检查变量${ckNames.map(x => '['+x+']').join('或')}`, {notify: true});
                return false;
            }
            this.log(`共找到${this.userCount}个账号`);
            return true;
        }
        async threads(taskName, conf, opt = {}) {
            while (conf.idx < $.userList.length) {
                let user = $.userList[conf.idx++];
                if(!user.valid) continue;
                await user[taskName](opt);
            }
        }
        async threadTask(taskName, thread) {
            let taskAll = [];
            let taskConf = {idx:0};
            while(thread--) taskAll.push(this.threads(taskName, taskConf));
            await Promise.all(taskAll);
        }
        time(t, x = null) {
            let xt = x ? new Date(x) : new Date;
            let e = {
                "M+": xt.getMonth() + 1,
                "d+": xt.getDate(),
                "h+": xt.getHours(),
                "m+": xt.getMinutes(),
                "s+": xt.getSeconds(),
                "q+": Math.floor((xt.getMonth() + 3) / 3),
                S: this.padStr(xt.getMilliseconds(), 3)
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, (xt.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for(let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length)));
            return t;
        }
        async showmsg() {
            if(!this.notifyFlag) return;
            if(!this.notifyStr.length) return;
            var notify = require('../sendNotify');
            this.log('\n============== 推送 ==============');
            await notify.sendNotify(this.name, this.notifyStr.join('\n'));
        }
        padStr(num, length, opt = {}) {
            let padding = opt.padding || '0';
            let mode = opt.mode || 'l';
            let numStr = String(num);
            let numPad = (length > numStr.length) ? (length - numStr.length) : 0;
            let pads = '';
            for (let i=0; i < numPad; i++) {
                pads += padding;
            }
            if (mode == 'r') {
                numStr = numStr + pads;
            } else {
                numStr = pads + numStr;
            }
            return numStr;
        }
        json2str(obj, c, encode = false) {
            let ret = [];
            for (let keys of Object.keys(obj).sort()) {
                let v = obj[keys];
                if(v && encode) v = encodeURIComponent(v);
                ret.push(keys + '=' + v);
            }
            return ret.join(c);
        }
        str2json(str, decode = false) {
            let ret = {};
            for (let item of str.split('&')) {
                if(!item) continue;
                let idx = item.indexOf('=');
                if(idx == -1) continue;
                let k = item.substr(0, idx);
                let v = item.substr(idx + 1);
                if(decode) v = decodeURIComponent(v);
                ret[k] = v;
            }
            return ret;
        }
        randomPattern(pattern, charset = 'abcdef0123456789') {
            let str = '';
            for (let chars of pattern) {
                if (chars == 'x') {
                    str += charset.charAt(Math.floor(Math.random() * charset.length));
                } else if (chars == 'X') {
                    str += charset.charAt(Math.floor(Math.random() * charset.length)).toUpperCase();
                } else {
                    str += chars;
                }
            }
            return str;
        }
        randomString(len, charset = 'abcdef0123456789') {
            let str = '';
            for (let i = 0; i < len; i++) {
                str += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return str;
        }
        randomList(a) {
            let idx = Math.floor(Math.random() * a.length);
            return a[idx];
        }
        wait(t) {
            return new Promise(e => setTimeout(e, t));
        }
        async exitNow() {
            await this.showmsg();
            let e = Date.now();
            let s = (e - this.startTime) / 1000;
            this.log('');
            this.log(`[${this.name}]运行结束，共运行了${s}秒`, {time: true});
            process.exit(0);
        }
    }
    (name)
}
