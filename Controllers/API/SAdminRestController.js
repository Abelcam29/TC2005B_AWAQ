const SAService = require('../../Service/SAdminService');
require('dotenv').config();

/**
 * @param {*} req
 * @param {*} res
 */
async function getRegistros(req, res)
{
    try
    {
        const idUsuario = req.params.idUsuario;
        const registros = await SAService.getRegistros(idUsuario);
        if(registros.status)
        {
            return res.status(200).json({
                "status"  : "success",
                "total"   : registros.total,
                "registros": registros.data
            });
        }
    }catch(error){
        let jsonError = {
            "status" : "error",
            "message" : error.message
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}
/**
 * @param {*} req
 * @param {*} res
*/
async function getRegistrosPorUsuario(req, res)
{
    try
    {
        const idUsuario = req.params.idUsuario;
        if(!idUsuario)
        {
            return res.status(400).json({
                "status" : "error",
                "message" : "Falta el id del usuario"
            });
        }


        const registros = await SAService.getRegistrosPorUsuario(idUsuario);
        if(registros.getStatus()){
            return res.status(200).json({
                "status" : "success",
                "total" : registros.getRows().length,
                "registros" : registros.getRows()
            });
        } 
        else
        {
            return res.status(404).json({
                "status" : "error",
                "message" : registros.getErr()
            });
        }
    } catch(error)
    {
        let jsonError = {
            "status" : "error",
            "message" : error.message
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}
/**
 * @param {*} req 
 * @param {*} res 
 */
async function updateRegistro(req, res)
{
    try
    {
        const form = req.body;
        const idRegistro = req.params.idRegistro;
        const result = await SAService.updateRegistro(form, idRegistro);
        return res.status(200).json({
            "status" : "success",
            "total" : result.changes,
            "message" : "Registro actualizado"
        });
    }
    catch(error)
    {
        let jsonError = {
            "status" : "error",
            "message" : error.message
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
} 
/**
 * @param {*} req 
 * @param {*} res
 */
async function getUsersNoAceptados(req, res)
{
    try
    {
        const result = await SAService.getUsersNoAceptados();
        return res.status(200).json({
            "status" : "success",
            "total" : result.rows.length,
            "records" : result.rows
        });
    }
    catch(error)
    {
        let jsonError = {
            "status" : "error",
            "message" : error.message
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}

/**
 * @param {*} req
 * @param {*} res
 */
async function AceptarUsuario(req, res)
{
    try
    {
        const idUsuario = req.params.idUsuario;
        const result = await SAService.AceptarUsuario(idUsuario);
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
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}

/**
 * @param {*} req
 * @param {*} res
 */
async function RechazarUsuario(req, res)
{
    try
    {
        const idUsuario = req.params.idUsuario;
        const result = await SAService.RechazarUsuario(idUsuario);
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
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}
/**
 * @param {*} req 
 * @param {*} res 
 */
async function AceptarUsuariosAll(req, res)
{
    try
    {
        const result = await SAService.AceptarUsuariosAll();
        return res.status(200).json({
            "status" : "success",
            "total" : result.changes,
            "records" : result.data
        });
    } catch(error)
    {
        let jsonError = {
            "status" : "error",
            "message" : error.message
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}

async function getPendientes(req, res)
{
    try
    {
        const result = await SAService.getPendientes();
        const count = result.getRows()[0]?.total || 0;
        return res.status(200).json({count: count});
    } catch(error)
    {
        let jsonError = {
            "status" : "error",
            "message" : error.message
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}

async function usuariosActivos(req, res) {
    try {
        const result = await SAService.usuariosActivos();
        const count = result.getRows()[0]?.total || 0;
        return res.status(200).json({ count: count});
    } catch(error) {
        let jsonError = {
            "status" : "error",
            "message" : error.message
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}

async function totalRegistros(req, res) {
    try {
        const result = await SAService.totalRegistros();
        const count = result.getRows()[0]?.total || 0;
        return res.status(200).json({ count: count});
    } catch(error) {
        let jsonError = {
            "status" : "error",
            "message": error.message
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}

async function usuariosInactivos(req, res) {
    try {
        const result = await SAService.usuariosInactivos();
        const count = result.getRows()[0]?.total || 0;
        return res.status(200).json({ count: count});
    } catch(error) {
        let jsonError = {
            "status" : "error",
            "message": error.message
        }
        console.log(error);
        return res.status(500).json(jsonError);
    }
}
module.exports = {getRegistros, 
    getRegistrosPorUsuario, 
    updateRegistro, 
    getUsersNoAceptados, 
    AceptarUsuario, 
    RechazarUsuario, 
    AceptarUsuariosAll, 
    getPendientes,
    usuariosActivos,
    totalRegistros,
    usuariosInactivos};