const { Pool } = require('pg');

const config = {
    user: 'postgres',
    host: 'localhost',
    password: '',
    database: 'skatepark',
    port: '5432',
};

const pool = new Pool(config);

//Función para CREAR skater
const nuevoSkater = async(skater) => {
    let email = skater[0];
    let nombre = skater[1];
    let password = skater[2];
    let experiencia = skater[3];
    let especialidad = skater[4];
    let foto = skater[5];
    let estado = skater[6];

    try {
        const numero = await pool.query('select count(*) from skaters');
        const id = (parseInt(numero.rows[0].count) + 1);
        const resultado = await pool.query(`insert into skaters values(${id}, '${email}', '${nombre}', '${password}', ${experiencia}, '${especialidad}', '${foto}', '${estado}', 0) returning *`);
        //console.log(resultado.rows);
        return resultado.rows;
    } catch (error) {
        console.log(error);
        return error;
    }
}

//Función OBTENER skaters
const obtenerSkaters = async() => {
    try {
        const resultado = await pool.query("select * from  skaters");
        //console.log('skaters desde obtenerSkaters: ', result.rows);
        return resultado.rows;
    } catch (error) {
        console.log(error);
        return error;
    }
}

//Función para ACTUALIZAR estado de skater
const cambiarEstadoSkater = async(id, estado) => {
    try {
        const resultado = await pool.query(`update skaters set estado = ${estado} where id = ${id} returning *`);
        return resultado.rows[0];
    } catch (error) {
        console.log(error);
        return error;
    }
}

const consultaRegistro = async(email, password) => {
    //let email = skater[0];
    //let password = skater[1];
    console.log('consultaRegistr: ', email, password);

    try {
        const resultado = await pool.query(`select * from skaters where email = '${email}' and password = '${password}'`);
        console.log('consulta: ', resultado.rows);

        if(resultado.rows < 1){
            return false;
        } else{
            return resultado.rows;
        }

    } catch (error) {
        console.log(error);
        return error;
    }
}

//Función para ACTUALIZAR skater
const editarSkater = async(id, nombre, password, experiencia, especialidad) => {
    try {
        const resultado = await pool.query(`update skaters set nombre = '${nombre}', password = '${password}',especialidad = '${especialidad}', anos_experiencia = ${experiencia} where id = ${id} returning *`);
        return resultado.rows;
    } catch (error) {
        console.log(error);
        return error;
    }
}

//Función para ELIMINAR skater
const eliminarSkater = async(id) => {
    try {
        const resultado = await pool.query(`delete from skaters where id = ${id}`);
        return resultado;
    } catch (error) {
        console.log(error);
        return error;
    }
}


module.exports = { nuevoSkater, consultaRegistro, cambiarEstadoSkater, obtenerSkaters, editarSkater, eliminarSkater };