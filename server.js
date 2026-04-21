import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Coze OAuth 配置
const COZE_APP_ID = '1107265061861';
const COZE_PUBLIC_KEY_ID = 'KR62S2yTi2LwOlefqIavAF9l5Z6Zen-KmdUBSjdjcG0';
const PRIVATE_KEY_FILE = join(__dirname, 'private_key.pem');

// 读取私钥
const privateKey = readFileSync(PRIVATE_KEY_FILE, 'utf8');

// 创建 HTTP 服务器
const server = http.createServer(async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const currentUrl = new URL(req.url, `http://localhost:${PORT}`);

  // 处理 /api/coze/token 请求
  if (currentUrl.pathname === '/api/coze/token' && req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const { user_id = 'anonymous' } = JSON.parse(body);

        // 生成 JWT
        const payload = {
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 600,
          jti: Math.random().toString(36).substring(7),
          aud: 'api.coze.cn',
          iss: COZE_APP_ID,
          session_name: user_id
        };

        const headers = { kid: COZE_PUBLIC_KEY_ID };
        const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', header: headers });

        // 换取 Access Token
        const response = await fetch('https://api.coze.cn/api/permission/oauth2/token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            duration_seconds: 86399,
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
          })
        });

        const data = await response.json();

        if (response.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: data.message || 'Token获取失败' }));
        }
      });
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // 处理 /api/coze/refresh-token 请求
  if (currentUrl.pathname === '/api/coze/refresh-token' && req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const { user_id = 'anonymous' } = JSON.parse(body);

        // 生成 JWT
        const payload = {
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 600,
          jti: Math.random().toString(36).substring(7),
          aud: 'api.coze.cn',
          iss: COZE_APP_ID,
          session_name: user_id
        };

        const headers = { kid: COZE_PUBLIC_KEY_ID };
        const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', header: headers });

        // 换取 Access Token
        const response = await fetch('https://api.coze.cn/api/permission/oauth2/token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            duration_seconds: 86399,
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
          })
        });

        const data = await response.json();

        if (response.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: data.message || 'Token刷新失败' }));
        }
      });
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // 处理静态文件
  let filePath = currentUrl.pathname === '/' ? '/index.html' : currentUrl.pathname;
  filePath = join(__dirname, filePath);

  try {
    const fs = await import('fs');
    const content = fs.readFileSync(filePath);
    const ext = filePath.split('.').pop();
    const contentTypes = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'pem': 'text/plain'
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = process.env.DEPLOY_RUN_PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
