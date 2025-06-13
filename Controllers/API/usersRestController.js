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

// Obtener biomos del usuario
async function getUserBiomos(req, res) {
    try {
        const idUsuario = req.params.idUsuario;
        const result = await userService.getUserBiomos(idUsuario);

        return res.status(200).json({
            status: "success",
            total: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
}

// Crear anteproyecto con biomos asociados
async function insertAnteproyecto(req, res) {
    try {
        console.log('🔍 === INICIO insertAnteproyecto CONTROLLER ===');
        console.log('📋 Body:', JSON.stringify(req.body, null, 2));
        
        const { idConvocatoria, biomoIds } = req.body;
        const idUsuario = req.params.idUsuario;
        
        // Validaciones...
        if (!idConvocatoria) {
            return res.status(400).json({
                "status": "error",
                "message": "Debe seleccionar una convocatoria"
            });
        }

        if (!biomoIds || !Array.isArray(biomoIds) || biomoIds.length === 0) {
            return res.status(400).json({
                "status": "error",
                "message": "Debe seleccionar al menos un biomo"
            });
        }

        console.log('✅ Validaciones OK');

        // ✅ PASO 1: Crear anteproyecto
        console.log('🔄 Creando anteproyecto...');
        const anteproyectoData = { idConvocatoria, biomoIds };
        const anteproyectoResult = await userService.insertAnteproyecto(anteproyectoData, idUsuario);
        
        console.log('📝 Resultado anteproyecto completo:', anteproyectoResult);
        console.log('📝 Anteproyecto success:', anteproyectoResult.success);
        console.log('📝 Anteproyecto status:', anteproyectoResult.getStatus());
        
        if (!anteproyectoResult.getStatus()) {
            console.log('❌ Error creando anteproyecto:', anteproyectoResult.getErr());
            return res.status(500).json({
                "status": "error",
                "message": "Error al crear anteproyecto: " + anteproyectoResult.getErr()
            });
        }

        const idAnteproyecto = anteproyectoResult.getGenId();
        console.log('🆔 ID Anteproyecto creado:', idAnteproyecto);

        // ✅ PASO 2: Asociar biomos
        console.log('🔄 Asociando biomos...');
        const biomosResult = await userService.insertAnteproyectoBiomos(idAnteproyecto, biomoIds);
        
        console.log('📋 Resultado biomos completo:', biomosResult);
        console.log('📋 Biomos success:', biomosResult.success);
        console.log('📋 Biomos status:', biomosResult.getStatus());
        console.log('📋 Biomos error:', biomosResult.getErr());
        
        if (!biomosResult.getStatus()) {
            console.log('❌ Error asociando biomos:', biomosResult.getErr());
            return res.status(500).json({
                "status": "error",
                "message": "Error al asociar biomos: " + biomosResult.getErr()
            });
        }

        console.log('✅ TODO EXITOSO - Anteproyecto y biomos creados');

        return res.status(200).json({
            "status": "success",
            "message": "Anteproyecto creado exitosamente",
            "data": {
                "idAnteproyecto": idAnteproyecto,
                "biomosSeleccionados": biomoIds.length,
                "biomosInsertados": biomosResult.getChanges() || biomosResult.getRows().length
            }
        });
        
    } catch(error) {
        console.error('💥 Error general en controller:', error);
        return res.status(500).json({
            "status": "error",
            "message": error.message || 'Error interno del servidor'
        });
    }
}

// Obtener anteproyectos abiertos (por fecha de cierre)
async function getAnteproyectosAbiertos(req, res) {
    try {
        const result = await userService.getAnteproyectosAbiertos();
        return res.status(200).json({
            status: "success",
            total: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
}

// Obtener anteproyectos cerrados
async function getAnteproyectosCerrados(req, res) {
    try {
        const result = await userService.getAnteproyectosCerrados();
        return res.status(200).json({
            status: "success",
            total: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
}
async function getAnteproyectoPDF(req, res) {
    try {
        console.log('🔍 === INICIO getAnteproyectoPDF ===');
        const idAnteproyecto = req.params.idAnteproyecto;
        console.log('🆔 ID Anteproyecto solicitado:', idAnteproyecto);
        
        if (!idAnteproyecto) {
            return res.status(400).json({
                status: 'error',
                message: 'ID de anteproyecto requerido'
            });
        }

        // ✅ OBTENER TOKEN del header o query parameter
        let token = null;
        
        // Intentar obtener del header Authorization
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('🔑 Token obtenido del header');
        }
        
        // Si no hay token en header, intentar obtener del query parameter
        if (!token && req.query.token) {
            token = req.query.token;
            console.log('🔑 Token obtenido del query parameter');
        }
        
        if (!token) {
            console.log('❌ No se encontró token de autenticación');
            return res.status(401).json({
                status: 'error',
                message: 'Token de autenticación requerido'
            });
        }

        // ✅ VERIFICAR TOKEN MANUALMENTE (ya que no pasó por el middleware)
        const jwt = require('jsonwebtoken');
       let decodedToken;
        
        try {
            console.log('🔑 Verificando token con SECRET...');
            decodedToken = jwt.verify(token, SECRET); // ✅ USAR SECRET (no process.env.JWT_SECRET)
            console.log('✅ Token válido para usuario:', decodedToken.id);
        } catch (tokenError) {
            console.log('❌ Token inválido:', tokenError.message);
            return res.status(401).json({
                status: 'error',
                message: 'Token inválido: ' + tokenError.message
            });
        }

        // Obtener información del anteproyecto
        const anteproyectoResult = await userService.getAnteproyectoById(idAnteproyecto);
        
        if (!anteproyectoResult.getStatus() || anteproyectoResult.getRows().length === 0) {
            console.log('❌ Anteproyecto no encontrado');
            return res.status(404).json({
                status: 'error',
                message: 'Anteproyecto no encontrado'
            });
        }

        const anteproyecto = anteproyectoResult.getRows()[0];
        const nombreArchivo = anteproyecto.nombre;
        console.log('📄 Nombre del archivo:', nombreArchivo);

        // Verificar que el nombre del archivo termine en .pdf
        if (!nombreArchivo || !nombreArchivo.toLowerCase().endsWith('.pdf')) {
            console.log('❌ Nombre de archivo inválido:', nombreArchivo);
            return res.status(400).json({
                status: 'error',
                message: 'Archivo no es un PDF válido'
            });
        }

        // Ruta del archivo PDF
        const path = require('path');
        const fs = require('fs');
        
        // ✅ RUTA: uploads/anteproyectos/
        const rutaPDF = path.join(__dirname, '../../public/uploads/anteproyectos/', nombreArchivo);
        console.log('📁 Ruta completa del PDF:', rutaPDF);

        // Verificar que el archivo existe
        if (!fs.existsSync(rutaPDF)) {
            console.log('❌ Archivo PDF no encontrado en:', rutaPDF);
            
            // Listar archivos en el directorio para debugging
            try {
                const dirPath = path.join(__dirname, '../../uploads/anteproyectos/');
                if (fs.existsSync(dirPath)) {
                    const files = fs.readdirSync(dirPath);
                    console.log('📁 Archivos en directorio:', files);
                } else {
                    console.log('📁 Directorio no existe:', dirPath);
                }
            } catch (dirError) {
                console.log('❌ Error leyendo directorio:', dirError.message);
            }
            
            return res.status(404).json({
                status: 'error',
                message: `Archivo PDF no encontrado: ${nombreArchivo}`
            });
        }

        console.log('✅ Archivo encontrado, enviando PDF...');

        // Configurar headers para mostrar el PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Crear stream del archivo y enviarlo
        const fileStream = fs.createReadStream(rutaPDF);
        
        fileStream.on('error', (error) => {
            console.error('❌ Error leyendo archivo:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    status: 'error',
                    message: 'Error al leer el archivo PDF'
                });
            }
        });

        fileStream.on('end', () => {
            console.log('✅ PDF enviado exitosamente');
        });

        fileStream.pipe(res);

    } catch (error) {
        console.error('💥 Error en getAnteproyectoPDF:', error);
        if (!res.headersSent) {
            res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor'
            });
        }
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
    getConvocatoriasCerradas,
    getUserBiomos,
    insertAnteproyecto,
    getAnteproyectosAbiertos,
    getAnteproyectosCerrados,
    getAnteproyectoPDF
}