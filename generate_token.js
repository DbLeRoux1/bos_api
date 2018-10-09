const rs = require('readline-sync');
const jssha = require('jssha');

const user = rs.question('Username: ');
const password = rs.question('Password: ');

const hmac = new jssha('SHA-256', 'TEXT');
hmac.setHMACKey(password, 'TEXT');
hmac.update(user);
hmac.update(Date.now().toString(36).substring(0, 4));
hmac.getHMAC('HEX');

console.log(`${hmac.getHMAC('HEX')}%${user}`);
