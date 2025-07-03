const tls = require('tls');
const ejs = require('ejs');

const hostname = 'heyjude'

class Emailer {
  constructor() {
    this.email = process.env.EMAIL_ADDRESS;
    this.password = process.env.EMAIL_APP_PASSWORD;;
    this.host = process.env.EMAIL_SMTP_HOST;
    this.port = process.env.EMAIL_PORT;
  }
  
  async renderTemplate(templatePath, data) {
    try {
      return await ejs.renderFile(templatePath, data);
    } catch (error) {
      throw new Error(`renderTemplate failed: ${error.message}`);
    }
  }

  base64Encode(str) {
    return Buffer.from(str).toString('base64');
  }

  sendCommand(socket, command, expected) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`timout: ${command}`));
      }, 10000);

      const onData = (data) => {
        clearTimeout(timeout);
        socket.removeListener('data', onData);
        socket.removeListener('error', onError);
        
        const response = data.toString();
        
        if (expected && !response.startsWith(expected)) {
          reject(new Error(`expected ${expected}, got: ${response}`));
        } else {
          resolve(response);
        }
      };

      const onError = (error) => {
        clearTimeout(timeout);
        socket.removeListener('data', onData);
        socket.removeListener('error', onError);
        reject(error);
      };

      socket.once('data', onData);
      socket.once('error', onError);
      
      if (command) {
        socket.write(command + '\r\n');
      }
    });
  }

  async send(to, subject, templatePath, templateData = {}, textBody = '') {
    return new Promise(async (resolve, reject) => {
      let htmlBody;
      try {
        htmlBody = await this.renderTemplate(templatePath, templateData);
      } catch (error) {
        return reject(error);
      }

      const boundary = '----EmailBoundary' + Date.now();
      let message = `From: ${this.email}\r\n`;
      message += `To: ${to}\r\n`;
      message += `Subject: ${subject}\r\n`;
      message += `MIME-Version: 1.0\r\n`;
      message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
      
      if (textBody) {
        message += `--${boundary}\r\n`;
        message += `Content-Type: text/plain; charset=utf-8\r\n`;
        message += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
        message += `${textBody}\r\n\r\n`;
      }
      
      message += `--${boundary}\r\n`;
      message += `Content-Type: text/html; charset=utf-8\r\n`;
      message += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      message += `${htmlBody}\r\n\r\n`;
      message += `--${boundary}--\r\n`;

      const tlsSocket = tls.connect({
        host: this.host,
        port: this.port,
        rejectUnauthorized: false
      });

      tlsSocket.setTimeout(30000);

      tlsSocket.on('timeout', () => {
        tlsSocket.destroy();
        reject(new Error('timeout'));
      });

      tlsSocket.on('error', (error) => {
        reject(new Error(`error: ${error.message}`));
      });

      tlsSocket.on('secureConnect', async () => {
        try {
          // console.log('connected');
          
          await this.sendCommand(tlsSocket, null, '220');
          await this.sendCommand(tlsSocket, `EHLO ${hostname}`, '250');
          await this.sendCommand(tlsSocket, 'AUTH LOGIN', '334');
          await this.sendCommand(tlsSocket, this.base64Encode(this.email), '334');
          await this.sendCommand(tlsSocket, this.base64Encode(this.password), '235');
          await this.sendCommand(tlsSocket, `MAIL FROM:<${this.email}>`, '250');
          await this.sendCommand(tlsSocket, `RCPT TO:<${to}>`, '250');
          await this.sendCommand(tlsSocket, 'DATA', '354');
          await this.sendCommand(tlsSocket, message + '\r\n.', '250');
          await this.sendCommand(tlsSocket, 'QUIT', '221');
          
          tlsSocket.end();
          resolve('sent');
          
        } catch (error) {
          tlsSocket.destroy();
          reject(error);
        }
      });
    });
  }
}

module.exports = Emailer;