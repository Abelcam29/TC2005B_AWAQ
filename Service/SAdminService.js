const dataSource = require('../Datasource/MySQLMngr');
const hashService = require('./hashPassword');
const imageService = require('./imageUploadService');
/**
 * @param {*} user
 * returns
*/ 
async function getRegistros(idUsuario) {
    let qResult;
    try 
    {
        let query = "SELECT * FROM formularioInicial WHERE idCreador = ?";
        let params = [idUsuario];
        qResult = await dataSource.getDataWithParams(query, params);
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}
/**
 * @param {int} idUsuario
 * @returns 
*/
async function getRegistrosPorUsuario(idUsuario) {
    let qResult;
    try {
        // ✅ CAMBIO: En lugar de obtener un solo tipo, obtener TODOS los formularios del usuario
        let query1 = "SELECT * FROM formularioInicial WHERE idCreador = ?";
        let params1 = [idUsuario];
        let result1 = await dataSource.getDataWithParams(query1, params1);
        
        if (result1.getRows().length === 0) {
            // ✅ Devolver array vacío en lugar de error
            qResult = new dataSource.QueryResult(true, [], 0, 0, '');
            return qResult;
        }

        // ✅ OBTENER TODOS LOS REGISTROS DE TODOS LOS TIPOS
        const formularios = result1.getRows();
        let allRegistros = [];

        // ✅ ITERAR SOBRE CADA FORMULARIO Y OBTENER SUS DATOS ESPECÍFICOS
        for (const formulario of formularios) {
            const tipoRegistro = formulario.tipoRegistro;
            
            try {
                // ✅ JOIN ESPECÍFICO PARA CADA TIPO
                let querySpecific = `
                    SELECT fi.*, R.*, u.Nombre, u.email, u.rol
                    FROM usuario u
                    JOIN formularioInicial fi ON u.idUsuario = fi.idCreador
                    JOIN ${tipoRegistro} R ON fi.idFormIn = R.idRegistro
                    WHERE fi.idFormIn = ?
                `;
                let paramsSpecific = [formulario.idFormIn];
                let resultSpecific = await dataSource.getDataWithParams(querySpecific, paramsSpecific);
                
                // ✅ Agregar los registros encontrados al array total
                if (resultSpecific.getStatus() && resultSpecific.getRows().length > 0) {
                    allRegistros = allRegistros.concat(resultSpecific.getRows());
                }
            } catch (joinError) {
                // ✅ Si falla el JOIN para un tipo específico, agregar solo el formulario base
                console.log(`⚠️ No se pudo hacer JOIN para tipo ${tipoRegistro}:`, joinError.message);
                allRegistros.push({
                    ...formulario,
                    error_join: `No se encontraron datos específicos para ${tipoRegistro}`
                });
            }
        }

        // ✅ CREAR RESULTADO CON TODOS LOS REGISTROS
        qResult = new dataSource.QueryResult(true, allRegistros, allRegistros.length, 0, '');
        
    } catch(err) {
        console.error('❌ Error en getRegistrosPorUsuario:', err);
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}
/**
 * @param {*} form
 * @returns
 */
async function updateRegistro(form, idRegistro) {
    let qResult;
    try
    {
        let query1 = "UPDATE formularioInicial SET estadoTiempo = ?, estacion = ?, tipoRegistro = ? WHERE idFormIn = ?";
        let params1 = [
            form.estadoTiempo,
            form.estacion,
            form.tipoRegistro,
            form.idFormIn
        ];
        qResult = await dataSource.updateData(query1, params1);

        let query, params, qResult2;
        const r2 = await getRegistrosPorUsuario(form);

        if (r2.getStatus()) {
            switch(form.tipoRegistro) {
                case 'variables_climaticas':
                    query = "UPDATE variables_climaticas SET zona = ?, pluviosidadMm = ?, temperaturaMaxima = ?, humedadMaxima = ?, temperaturaMinima = ?, nivelQuebradaMt = ? WHERE idRegistro = ?";
                    params = [form.zona, form.pluviosidadMm, form.temperaturaMaxima, form.humedadMaxima, form.temperaturaMinima, form.nivelQuebradaMt, idRegistro];
                    break;
                case 'camaras_trampa':
                    query = "UPDATE camaras_trampa SET codigo = ?, zona = ?, nombreCamara = ?, placaCamara = ?, placaGuaya = ?, anchoCaminoft = ?, fechaInstalacion = ?, distanciaObjetivoMt = ?, alturaLenteMt = ?, listaChequeo = ?, evidencias = ?, observaciones = ? WHERE idRegistro = ?";
                    params = [form.codigo, form.zona, form.nombreCamara, form.placaCamara, form.placaGuaya, form.anchoCaminoft, form.fechaInstalacion, form.distanciaObjetivoMt, form.alturaLenteMt, form.listaChequeo, form.evidencias, form.observaciones, idRegistro];
                    break;
                case 'fauna_busqueda_libre':
                    query = "UPDATE fauna_busqueda_libre SET zona = ?, tipoAnimal = ?, nombreComun = ?, nombreCientifico = ?, numeroIndividuos = ?, tipoObservacion = ?, alturaObservacion = ?, evidencias = ?, observaciones = ? WHERE idRegistro = ?";
                    params = [form.zona, form.tipoAnimal, form.nombreComun, form.nombreCientifico, form.numeroIndividuos, form.tipoObservacion, form.alturaObservacion, form.evidencias, form.observaciones, idRegistro];
                    break;
                case 'fauna_punto_conteo':
                    query = "UPDATE fauna_punto_conteo SET zona = ?, tipoAnimal = ?, nombreComun = ?, nombreCientifico = ?, numeroIndividuos = ?, tipoObservacion = ?, alturaObservacion = ?, evidencias = ?, observaciones = ? WHERE idRegistro = ?";
                    params = [form.zona, form.tipoAnimal, form.nombreComun, form.nombreCientifico, form.numeroIndividuos, form.tipoObservacion, form.alturaObservacion, form.evidencias, form.observaciones, idRegistro];
                    break;
                case 'fauna_transecto':
                    query = "UPDATE fauna_transecto SET numeroTransecto = ?, tipoAnimal = ?, nombreComun = ?, nombreCientifico = ?, nroIndividuos = ?, tipObservacion = ?, evidencias = ?, observaciones = ? WHERE idRegistro = ?";
                    params = [form.numeroTransecto, form.tipoAnimal, form.nombreComun, form.nombreCientifico, form.nroIndividuos, form.tipObservacion, form.evidencias, form.observaciones, idRegistro];
                    break;
                case 'parcela_vegetacion':
                    query = "UPDATE parcela_vegetacion SET cuadrante = ?, sobcuadrante = ?, habitoCrecimiento = ?, nombreComun = ?, nombreCientifico = ?, placa = ?, circunferencia = ?, distanciaMt = ?, estaturaBiomonitorMt = ?, alturaMt = ?, evidencias = ?, observaciones = ? WHERE idRegistro = ?";
                    params = [form.cuadrante, form.sobcuadrante, form.habitoCrecimiento, form.nombreComun, form.nombreCientifico, form.placa, form.circunferencia, form.distanciaMt, form.estaturaBiomonitorMt, form.alturaMt, form.evidencias, form.observaciones, idRegistro];
                    break;
                case 'validacion_cobertura':
                    query = "UPDATE validacion_cobertura SET codigo = ?, seguimiento = ?, cambio = ?, cobertura = ?, tiposCultivo = ?, disturbio = ?, evidencias = ?, observaciones = ? WHERE idRegistro = ?";
                    params = [form.codigo, form.seguimiento, form.cambio, form.cobertura, form.tiposCultivo, form.disturbio, form.evidencias, form.observaciones , idRegistro];
                    break;
                default:
                    throw new Error('Tipo de registro no válido');
            }
            // Solo ejecuta el update si query y params están definidos
            if (query && params) {
                qResult2 = await dataSource.updateData(query, params);
            } else {
                throw new Error('No se pudo construir el query de actualización');
            }
            return {success: true, qResult, qResult2};
        } else {
            throw new Error('No se encontró el registro a actualizar');
        }
    } catch(err) {
        return {success: false, error: err.message};
    }
}

/**
 * @returns
 */

async function getUsersNoAceptados() 
{
    let qResult;
    try
    {
        let query = "SELECT * FROM usuario WHERE estado = ?";
        let params = ['P']; 
        qResult = await dataSource.getDataWithParams(query, params);
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [], 0,0, err.message);
    }
    return qResult;
}
/**
 * @returns
 * @param {*} idUsuario 
 */
async function AceptarUsuario(idUsuario)
{
    let qResult;
    try
    {
        let query = "UPDATE usuario SET estado = ? WHERE idUsuario = ?";
        let params = ['A', idUsuario];
        qResult = await dataSource.updateData(query, params);
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}

/**
 * @returns
 * @param {*} idUsuario 
 */
async function RechazarUsuario(idUsuario)
{
    let qResult;
    try
    {
        let query = "UPDATE usuario SET estado = ? WHERE idUsuario = ?";
        let params = ['I', idUsuario]; // 'I' for Inactive/Rejected
        qResult = await dataSource.updateData(query, params);
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}

async function AceptarUsuariosAll()
{
    let qResult;
    try
    {
        let query = "UPDATE usuario SET estaado = ? WHERE estado = ?";
        let params = ['A', 'P'];
        qResult = await dataSource.updateData(query, params);
    } catch(err)
    {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}

async function getPendientes() {
    let qResult;
    try {
        let query = "SELECT count(*) as total FROM usuario WHERE estado = ?";
        let params = ['P'];
        qResult = await dataSource.getDataWithParams(query, params);
    } catch(err) {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}

async function usuariosActivos() {
    let qResult;
    try {
        let query = "SELECT count(*) as total FROM usuario WHERE estado = ?";
        let params = ['A'];
        qResult = await dataSource.getDataWithParams(query, params);
    } catch(err) {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}

async function totalRegistros() {
    let qResult;
    try {
        let query = "SELECT count(*) as total FROM formularioInicial";
        qResult = await dataSource.getData(query);
    } catch(err) {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}

async function usuariosInactivos() {
    let qResult;
    try {
        let query = "SELECT count(*) as total FROM usuario WHERE estado = ?";
        let params = ['I'];
        qResult = await dataSource.getDataWithParams(query, params);
    } catch(err) {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}
/**
 * @returns
 * @param {*} user 
 */
async function registrarUsuario(user)
{
    let qResult;
    try
    {
        let query = "INSERT INTO usuario (Nombre, Apellidos, email, password, pais, nuemrotel, region, ciudad, nombreOrganizacion, descOrganizacion, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const salt = hashService.getsalt();
        const hash = hashService.encryptPassword(user.password, salt);
        const hash_password = salt + hash;
        let params = [
            user.Nombre,
            user.Apellidos,
            user.email,
            hash_password,
            user.pais,
            user.numerotel,
            user.region,
            user.ciudad,
            user.nombreOrganizacion,
            user.descOrganizacion,
            user.rol
        ];
        qResult = await dataSource.insertData(query, params);
        const idUser = qResult.getGenId();
        let idImagen = 1;
        if(user.imagen)
        {
            let imageObj = {...user.imagen, usuario_carga: idUser};
            let qResultImg = await imageService.uploadedImageLog(imageObj);
            if(qResultImg && qResultImg.getStatus()) {
                idImagen = qResultImg.getGenId();
            }
        }
        else
        {
            let imageObj = {
                base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                name: "default.jpg",
                usuario_carga: idUser
            };
            let qResultImg = await imageService.uploadedImageLog(imageObj);
        }
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
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