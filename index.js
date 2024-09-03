const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const port = 8080;

//核心科技
const key = Buffer.from([
//Removed
]);
const iv = Buffer.from([
//Removed
]);

// Password protection
const correctPassword = 'OvO'; 

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Check Login Status
app.get('/check-cookie', async (req, res) => {
    try {
        // 检查请求中是否包含名为 'auth' 的cookie
        if (req.cookies.auth && await decryptText(req.cookies.auth) === correctPassword) {
            // 如果cookie存在且解密后的内容与正确的密码匹配，则返回 { valid: true }
            res.json({ valid: true });
        } else {
            // 如果cookie不存在或解密后的内容不匹配，则返回 { valid: false }
            res.json({ valid: false });
        }
    } catch (error) {
        // 如果在处理过程中发生错误，返回 { valid: false }
        res.json({ valid: false });
    }
});

// Routes
app.get('/', (req, res) => {
    try {
        if (req.cookies.auth && decryptText(req.cookies.auth) === correctPassword) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } else {
            res.sendFile(path.join(__dirname, 'public', 'password.html'));
        }
    } catch (error) {
        res.sendFile(path.join(__dirname, 'public', 'password.html'));
    }
});

// Check Password  And Input
// 处理POST请求，路径为'/check-password'
app.post('/check-password', async (req, res) => {
    // 从请求体中解构出password字段
    const { password } = req.body;
    // 将加密后的密码进行URL编码并输出到控制台
    console.log(encodeURIComponent(await encryptText(password)));
    // 检查用户输入的密码是否与服务器端存储的正确密码匹配
    if (password === correctPassword) {
        // 如果匹配，将密码加密并进行URL编码
        const encryptedPassword = encodeURIComponent(await encryptText(password));
        // 设置一个名为'auth'的cookie，值为加密后的密码，cookie有效期为10小时
        res.cookie('auth', encryptedPassword, { maxAge: 36000000 });
        // 返回JSON响应，表示密码验证成功
        res.json({ success: true });
    } else {
        // 如果密码不匹配，返回JSON响应，表示密码验证失败
        res.json({ success: false });
    }
});


// 加密函数
async function encryptText(plainText) {
    let encrypted;  // 用于存储加密后的字符串     
 
    try {
        // 创建一个加密器对象，使用AES-256-CBC算法
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        // 使用加密器对明文进行加密
        // 'utf8' 表示输入的明文编码，'base64' 表示输出的加密文本编码
        encrypted = cipher.update(plainText, 'utf8', 'base64');

        // 处理加密的最后一块数据，并将其附加到加密结果中
        encrypted += cipher.final('base64');
    } catch (error) {
        // 如果加密过程中发生错误，返回字符串 "ERROR"
        return "Encrypt Error";
    }
    // 返回加密后的字符串
    return encrypted;
}


app.post('/encrypt', async (req, res) => {
    const plainTexts = req.body.text;
    const encryptedTexts = await Promise.all(plainTexts.map(encryptText));
    res.json({ result: encryptedTexts });
    // console.log(encryptedTexts);
});

// 解密函数
async function decryptText(cipherText) {
    let decodedCipherText;  // 用于存储解码后的密文
    try {
        // 尝试对密文进行URI解码
        decodedCipherText = decodeURIComponent(cipherText);
    } catch (error) {
        // 如果解码失败，返回字符串 "ERROR"
        return "URI Dec ERROR";
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted;
    try {
        decrypted = decipher.update(decodedCipherText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
    } catch (error) {
        // if decryption fails, return "ERROR"
        return "Decrypt ERROR";
    }
    return decrypted;
}

app.post('/decrypt', async (req, res) => {
    const cipherTexts = req.body.text;  // 从请求体中获取密文数组
    const decryptedTexts = await Promise.all(cipherTexts.map(decryptText));  // 异步解密所有密文
    res.json({ result: decryptedTexts });  // 将解密结果作为 JSON 响应返回
    // console.log(decryptedTexts);  // 可选：打印解密结果到控制台
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
