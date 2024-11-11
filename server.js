const express = require('express')
const { exec } = require('child_process')
const figlet = require('figlet')
const crypto = require('crypto');
const { getUser } = require('./database');

const app = express()
const port = 8000

app.use(express.static("public"))

const realm = 'User Visible Realm';

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
  
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      // Si no hay cabecera de autorización o no es del tipo Basic, pedir credenciales
      res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
      return res.status(401).send('Autenticación requerida');
    }
  
    // Decodificar credenciales base64
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
  
    const user = getUser(username);
    const md5hash = crypto.createHash('md5').update(password).digest('hex');
  
    if (!user || user.password !== md5hash) {
      // Si el usuario no existe o la contraseña es incorrecta
      res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
      return res.status(401).send('Credenciales incorrectas');
    }
  
    // Si las credenciales son correctas, continuar con la siguiente función
    return next();
  }

app.get("/", (req, res) => {
    exec(comando, (error, stdout, stderr) =>{
        res.send(stdout)
    });
})

app.get("/ping", (req, res) => {
    const dominio = req.query.dominio
    const comandoPing = `ping -c 4 ${dominio}`

    exec(comandoPing, (error, stdout, stderr) =>{
        res.send(stdout)
    });
})

//Obtenemos el texto con figlet
app.get("/figlet", authMiddleware, (req, res) =>{
    const texto = req.query.texto
    const fuentes = req.query.fuente

    figlet.text(
        `${texto}`,
        {
          font: fuentes,
          horizontalLayout: "default",
          verticalLayout: "default",
          width: 80,
          whitespaceBreak: true,
        },
        function (err, data) {
          if (err) {
            console.log("Something went wrong...");
            console.dir(err);
            return;
          }
          console.log(data);
          res.send(`<pre>${data}</pre>`)
        }
    );

})

//Obtenemos el JSON de las fuentes
app.get("/fuentes", (req, res) => {
    figlet.fonts(function (err, fonts) {
        if (err) {
          console.log("something went wrong...");
          console.dir(err);
          return;
        }
        console.dir(fonts);
        res.json(fonts)
    });
})

app.listen(port, () => {
    console.log(`Servidor iniciado en puerto ${port}`);
})