const userService = require('../../Service/usersService');
const hashService = require('../../Service/hashPassword');
const jwt = require('jsonwebtoken');
const e = require('express');
require('dotenv').config();

const SECRET = process.env.SECRET;

async function execLogin(req, res) {
    const {email, password} = req.body;
    console.log('Login request body:', req.body);
    const result = await userService.getValores(email);
    console.log("getValores:", result.status, result.rows.length);
    if (!result.status|| result.rows.length === 0) {
        return res.status(401).json({message: 'user not found'});
    }


    const estado = result.rows[0].estado;
    const rol = result.rows[0].rol;

    const user = await hashService.isValidUser(email, password);
    if (!user) {
        return res.status(401).json({message: 'Invalid credentials'});
    }
        const token = jwt.sign(
        {id: user.id, email: user.email, nombre: user.nombre, rol: rol},
        SECRET,
        {   expiresIn: '1h' }
    );
    return res.json({  token, rol, estado });
}

/**
 * El middleware que se ejecutara antes para proteger las rutas
 * @param {*} req es el request original
 * @param {*} res la respuesta del usuario
 * @param {*} next el metodo que sera ejecutado
 * @returns accesos no autorizados
 */
    async function authenticateToken(req, res, next)
    {
        let token = null;
        const authHeader = req.headers['authorization'];
        if(authHeader && authHeader.startsWith('Bearer ')){
            token = authHeader.split(' ')[1];
        } else if (req.query && req.query.token){
            token = req.query.token;
        }

        if(!token) return res.sendStatus(401);
        
        jwt.verify(token, SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    }
/**
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */

async function authenticateTokenAdmin(req, res, next)
{
    let token = null;
    const authHeader = req.headers['authorization'];
    if(authHeader && authHeader.startsWith('Bearer ')){
        token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token){
        token = req.query.token;
    }
    if(!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err, user) => {
        if(err) return res.sendStatus(403);
        if(user.rol >= 3){
            req.user = user;
            next();
        } else {
            return res.status(403).json({message: "Unauthorized"});
        }
    })
}

/**
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function authenticateTokenSAdmin(req, res, next)
{
    let token = null;
    const authHeader = req.headers['authorization'];
    if(authHeader && authHeader.startsWith('Bearer '))
    {
        token = authHeader.split(' ')[1];
    }
    else if(req.query && req.query.token)
    {
        token = req.query.token;
    }
    if(!token) return res.sendStatus(401);
    jwt.verify(token, SECRET, (err, user) => {
        if(err) return res.sendStatus(403);
        if(user.rol === 4)
        {
            req.user = user;
            next();
        }
        else
        {
            return res.status(403).json({message: "Unauthorized"});
        }
    })
}

/**
 * @param {Object} req
 * @param {Object} res
 */
async function getUsers(req, res){
    try{
        const result = await userService.getUsers();
        return res.status(200).json({
            "status"  : "success",
            "total"   : result.rows.length ,
            "records" : result.rows
        });
    }catch(error){
        let jsonError = {
            "status"  : "error",
            "message" : error.message
        };
        console.log(error);
        return res.status(500).json(jsonError);
    }
}
/**
 * Metodo que devuelve el usuario especifico basado en ID
 * @param {Object} req
 * @param {Object} res
 */
async function findUser(req,res)
{
    try
    {
        let idUsuario = req.params.idUsuario;
        const result = await userService.findUser(idUsuario);
        return res.status(200).json({
            "status"   :  "success",
            "user"     :  result.getRows()[0]
        });
    }
    catch(error)
    {
        let jsonError = {
            "status"  : "error",
            "message" : error.message
        };
        console.log(error);
        return res.status(500).json(jsonError);
        }
    }
/**
 * @param {Object} req
 * @param {Object} res
 */
async function insertUser(req, res)
{
    try
    {
        let user = req.body;
        const result = await userService.insertUser(user);
        return res.status(200).json({
            "status"  : "success",
            "total"   : result.changes,
            "records" : result.gen_id
        });
    }
    catch(error)
    {
        let jsonError = 
        {
            "status"  : "error",
            "message" : error.message
        };
        console.log(error);
        return res.status(500).json(jsonError);
    }
}

/**
 * @param {Object} req
 * @param {Object} res
 */
async function updateUser(req, res)
{
    try
    {
        const userId = req.user?.id;
        if(!userId)
        {
            return res.status(401).json({message: "Unauthorized"});
        }
        const userData = req.body;
        const currentUserResult = await userService.findUser(userId);
        if(!currentUserResult.getStatus() || currentUserResult.getRows().length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }
        const currentUser = currentUserResult.getRows()[0];

        if(userData.currentPassword && userData.newPassword) 
        {
            if(!currentUserResult.getStatus() || currentUserResult.getRows().length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuario no encontrado'
                });
            }

            const isValidPassword = hashService.comparePassword(userData.currentPassword, currentUser.password);
            if(!isValidPassword) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Contraseña actual incorrecta'
                });
            }
            const salt = hashService.getSalt();
            userData.password = hashService.encryptPassword(userData.newPassword, salt);
        } else 
        {
            userData.password = currentUser.password;
        }
        delete userData.currentPassword;
        delete userData.newPassword;

        const result = await userService.updateUser(userData, userId);
        if(result.getStatus()){
            return res.status(200).json({
                "status" : "success",
                "message" : "Usuario actualizado correctamente"
            });
        } else {
            return res.status(400).json({
                status: "error",
                message: "No se pudo actualizar el usuario"
            });
        }
    } catch(error)
    {
        let jsonError = {
            "status"  : "error",
            "message" : error.message
        };
        console.log(error);
        return res.status(500).json(jsonError);
    }
}

/**
 * @param {Object} req
 * @param {Object} res
 */
async function deleteUser(req,res)
{
    try
    {
        const user_id = req.body.user_id;
        if(req.user.id !== user_id && req.user.rol <=3)
        {
            return res.status(403).json({message: "Unauthorized"});
        }

        const result = await userService.deleteUser(user_id);
        return res.status(200).json({
        "status"  : "success",
        "total"   : result.changes
        });

    }
    catch(error)
    {
        let jsonError = {
            "status"  : "error",
            "message" : error.message
        };
        console.log(error);
        return res.status(500).json(jsonError);
    }
}
/**
 * @param {*} req 
 * @param {*} res 
 */
async function insertConvocatorias(req, res)
{
    try
    {
        const conv = req.body;
        const userId = req.params.idUsuario;
        if(!conv)
        {
            return res.status(400).json({
                "status" : "error",
                "message" : "Convocatoria no proporcionada"
            });
        }
        const result = await userService.insertConvocatorias(conv, userId);
        return res.status(200).json({
            "status" : "success",
            "total" : result.changes,
            "records" : result.data
        });
    }
    catch(error)
    {
        let jsonError = {
            "status" : "error",
            "message" : error.message
        };
        console.log(error);
        return res.status(500).json(jsonError);
    }
}
/**
 * @param {*} res
 */
async function getConvocatoriasAbiertas(req, res)
{
    try
    {
        const result = await userService.getConvocatoriasAbiertas();
        return res.status(200).json({
            "status" : "success",
            "total" : result.rows.length,
            "data" : result.rows
        });
    }
    catch(error)
    {
        let jsonError = {
            "status" : "error",
            "message" : error.message
        };
        console.log(error);
        return res.status(500).json(jsonError);
    }
}
/**
 * @param {*} res 
 */
async function getConvocatoriasCerradas(req, res)
{
    try
    {
        const result = await userService.getConvocatoriasCerradas();
        return res.status(200).json({
            "status" : "success",
            "total" : result.rows.length,
            "data" : result.rows
        });
    }
    catch(error)
    {
        let jsonError = {
            "status" : "error",
            "message": error.message
        };
        console.log(error);
        return res.status(500).json(jsonError);
    }
}
module.exports = {
    execLogin, 
    authenticateToken, 
    authenticateTokenAdmin, 
    authenticateTokenSAdmin, 
    getUsers, 
    findUser, 
    insertUser, 
    updateUser, 
    deleteUser,
    insertConvocatorias,
    getConvocatoriasAbiertas,
    getConvocatoriasCerradas
}