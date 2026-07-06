// 题库加密脚本 - 将 questions.json 加密为 src/data/encrypted.js
// 用法: node scripts/encrypt_questions.js <密码>
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASSWORD = process.argv[2];
if (!PASSWORD) { console.error('请提供密码: node encrypt_questions.js <密码>'); process.exit(1); }
const INPUT = path.join(__dirname, 'questions.json');
const OUTPUT = path.join(__dirname, '..', 'src', 'data', 'encrypted.js');

const raw = fs.readFileSync(INPUT, 'utf-8');
const encrypted = CryptoJS.AES.encrypt(raw, PASSWORD).toString();

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `// 此文件由 encrypt_questions.js 自动生成，请勿手动编辑\nexport const encryptedData = ${JSON.stringify(encrypted)};\n`);
console.log(`加密完成: ${encrypted.length} 字符 → ${OUTPUT}`);
