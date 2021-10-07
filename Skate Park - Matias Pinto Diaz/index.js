const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const expressFileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const llaveJwt = 'Mi llave';
//const agentes = require('./data/agentes.js');

//Middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('imgs'));
app.use(express.static(__dirname + '/public'));

app.use(expressFileUpload({
    limits: { fileSize: 5000000 },
    abortOnLimit: true,
    responseOnLimit: 'El peso del archivo supera el límite permitido',
    })
);

app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
//app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'));

app.engine(
    'handlebars',
    //Método que recibe un objeto de conf. se recibe layoutsDir y su valor es la ruta del directorio donde tendremos las vistas de la aplicación
    exphbs({
        defaultLayout: 'main',
        layoutsDir: `${__dirname}/views/mainLayout`, //Ruta para las vistas
        //partialsDir: __dirname + '/views/componentes', //Ruta donde se encontrarán los parciales o componentes
    })
);
app.set('view engine', 'handlebars');

const { nuevoSkater, consultaRegistro, cambiarEstadoSkater, obtenerSkaters, editarSkater, eliminarSkater } = require('./consultas');


//////////////////////////////////////////////////////////////////////////////////////////////////////////


//Ruta raíz
app.get('/', async(req, res) => {
    //res.sendFile(__dirname + '/index.html');
    const skaters = await obtenerSkaters();
    res.render("Home", {skaters});
    //res.render('Home');
});

//Ruta registro
app.get('/registro', (req, res) => {
    //res.sendFile(__dirname + '/index.html');
    res.render('Registro');
});

//Ruta login
app.get("/login", async (req, res) => {
    res.render("Login");
})

//Ruta para OBTENER skaters registrados
app.get("/registroSkaters", async (req, res) => {
    const skaters = await obtenerSkaters();
    res.render("Admin", {skaters});
    //res.send(registros);
})

//Ruta para ADMIN
app.get("/admin", async (req, res) => {
    try {
        const skaters = await obtenerSkaters();
        //console.log('skaters desde /admin: ', skaters);
        res.render("Admin", {skaters});
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal ${e}`,
            code: 500
        })
    }
})

//Actualiza estado de los skaters
app.put("/skaters", async (req, res) => {
    const { id, estado } = req.body;

    try {
        const skater = await cambiarEstadoSkater(id, estado);
        res.status(200).send(JSON.stringify(skater));
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal ${e}`,
            code: 500
        })
    }
})

//Ruta para crar un skater
app.post('/skater', async(req, res) => {
    const { imagen } = req.files;
    //console.log('foto: ', imagen);
    const { name } = imagen;
    const { email, nombre, password, experiencia, especialidad } = req.body;

    //
    imagen.mv(`${__dirname}/imgs/imagen-${name}-${nombre}.jpg`, (err) => {
        //res.sendFile(__dirname + '/Login.html');
    });

    let exp = parseInt(experiencia);
    let skater = {
        email: email,
        nombre: nombre,
        password: password,
        experiencia: exp,
        especialidad: especialidad,
        fotoSkt: name,
        estado: false,
    }
    const skaterNuevo = Object.values(skater);

    try {
        const respuesta = await nuevoSkater(skaterNuevo);
        res.render('Login');
    } catch (error) {
        console.log(error);
        return error;
    }

    //console.log(respuesta);
});

//Ruta para AUTENTICAR al skater
app.post("/autenticar", async function (req, res) {
    const { email, password } = req.body;

    const skater = await consultaRegistro(email, password);
    console.log('skater: ',  skater);

    if (skater[0].email) {
        if (skater[0].estado) {
            const token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + 120,
                    data: skater
                },
                llaveJwt
            );
            res.send(token);
        } else {
            res.status(401).send({
                error: "Este usuario aún no ha sido verificado",
                code: 401
            })
        }
    } else {
        res.status(404).send({
            error: "Este usuario no esta registrado en la base de datos",
            code: 404
        })
    }
})

//Ruta donde se VERIFICA TOKEN
app.get(`/datos`, function (req, res) {
    const { token } = req.query;

    jwt.verify(token, llaveJwt, (err, decode) => {
        //console.log('decode: ', decode);
        const { data } = decode;
        const { id, email, nombre, password, especialidad, anos_experiencia } = data[0];
        //console.log('data /datos: ', id, email);
        err ?
            res.status(401).send(
                res.send({
                    error: "401 No autorizado",
                    message: "Usted no esta autorizado para entrar en esta página",
                    token_error: err.message

                })
            ) :
            res.render("Datos", { id, email, nombre, password, especialidad, anos_experiencia});
    })
})

//Ruta para EDITAR skater
app.put("/editar", async (req, res) => {
    const { id, nombre, password, experiencia, especialidad } = req.body;

    try {
        const resultado = await editarSkater(id, nombre, password, experiencia, especialidad);
        res.status(200).render("Home");

    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal ${e}`,
            code: 500
        })
    }
})

//Ruta para ELIMINAR un skater
app.delete("/eliminar", async (req, res) => {   
    let {id} = req.body.source;
 
  try { 
        const registro = await eliminarSkater(id);
        res.status(200).render("Home");
        
    }  catch (e) {
        res.status(500).send({
            error: `Algo salio mal ${e}`,
            code: 500
        })
    } 
}) 


//////////////////////////////////////////////////////////////////////////////////////////////////////////


//Ruta por defecto (cuando no encuentra alguna ruta consultada)
app.get('*', (req, res) => {
    res.send('Esta página no existe...');
});
app.listen(3000, () => {
    console.log('Puerto 3000');
});