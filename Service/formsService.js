const dataSource = require('../Datasource/MySQLMngr');
const imageService = require('./imageUploadService');

/**
 * @returns
 */
async function insertformInicial(estadoTiempo, estacion, tipoRegistro, idUsuario){
    let qResult;
    try{
        let query = "INSERT INTO formularioinicial (estadoTiempo, estacion, tipoRegistro, idCreador) VALUES (?,?,?,?)";
        let params = [estadoTiempo, estacion, tipoRegistro, idUsuario];
        qResult = await dataSource.insertData(query, params);
    }
    catch(err){
        qResult = new dataSource.QueryResult(false, [], 0,0, err.message);
    }
    return qResult;
}

/**
 * @param {Array} evidencias
 * @param {number} idUsuario
 * @param {number} idRegistro
 * @returns {Promise<QueryResult>}
 */
async function processEvidencias(evidencias, idUsuario, idRegistro)
{
    try
    {
        if(evidencias.length > 5)
        {
            return new dataSource.QueryResult(false, [], 0, 0, 'No se pueden subir mas de 5 evidencias');
        }
        
        const processedImages = [];

        for (let i = 0; i < evidencias.length; i++) {
            const imagen = evidencias[i];
            if(!imagen.base64 || !imagen.name) {
                console.warn(`Imagen ${i} no tiene base64 o name, se omitirá`);
                continue;
            }

            const imageData = {
                base64: imagen.base64,
                name: imagen.name,
                usuario_carga: idUsuario,
                idForm: idRegistro
            };

            const result = await imageService.uploadedImageLog(imageData);
            if(result.getStatus()) {
                processedImages.push({
                    idImagen: result.getGenId(),
                    nombreImagen: imagen.name,
                });
                console.log(`Imagen ${i} procesada correctamente: ${imagen.name}`);
            }
            else {
                console.error(`Error procesando imagen ${i}:`, result.getErr());
            }
        }

        if(processedImages.length > 0) {
            return new dataSource.QueryResult(true, processedImages, processedImages.length, processedImages.length, 'Evidencias procesadas correctamente');
        } else {
            return new dataSource.QueryResult(false, [], 0, 0, 'No se procesaron evidencias');
        }
    } catch(err) {
        console.error('Error en processEvidencias:', err);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

/**
 * @param {*} form
 * @returns
 */
async function insertVClimaticas(form, idUsuario)
{
    let qResult;
    const consult = await insertformInicial(form.estadoTiempo, form.estacion, form.tipoRegistro, idUsuario);
    console.log('ID del registro creado en formularioinicial:', consult.gen_id);
    if(!consult.getStatus())
    {
        return consult;
    }
    console.log('ID del registro creado en formularioinicial:', consult.gen_id);
    const idRegistro = consult.gen_id;
    try{
        let query = "INSERT INTO variables_climaticas (idRegistro, zona, pluviosidadMm, temperaturaMaxima, humedadMaxima, temperaturaMinima, nivelQuebradaMt) VALUES(?,?,?,?,?,?,?)";
        let params = [
            idRegistro,
            form.zona, 
            form.pluviosidadMm, 
            form.temperaturaMaxima, 
            form.humedadMaxima, 
            form.temperaturaMinima,
            form.nivelQuebradaMt
        ];
        qResult = await dataSource.insertData(query, params);
    }
    catch(err){
        qResult = new dataSource.QueryResult(false, [],0,0, err.message);
    }
    return qResult;
}


/**
 * @param {*} form
 * @returns
 */
async function insertCamarasTrampa(form, idUsuario)
{
    let qResult;
    const consult = await insertformInicial(form.estadoTiempo, form.estacion, form.tipoRegistro, idUsuario);
    if(!consult.getStatus())
    {
        return consult;
    }
    const idRegistro = consult.gen_id;
    try{
        let evidenciasIds = null;
        if(form.evidencias && Array.isArray(form.evidencias) && form.evidencias.length > 0) {
            const imagesResult = await processEvidencias(form.evidencias , idUsuario, idRegistro);
            if(imagesResult.getStatus())
            {
                evidenciasIds = imagesReesult.getRows().map(row => row,idImagen).join(',');
            }
        }
        let query = "INSERT INTO camaras_trampa (idRegistro, codigo, zona, nombreCamara, placaCamara, placaGuaya, anchoCaminoMt, fechaInstalacion, distanciaObjetivoMt, alturaLenteMt, listaChequeo, evidencias, observaciones) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
        let params = [
            idRegistro,
            form.codigo,
            form.zona,
            form.nombreCamara,
            form.placaCamara,
            form.placaGuaya,
            form.anchoCaminoMt,
            form.fechaInstalacion,
            form.distanciaObjetivoMt,
            form.alturaLenteMt,
            form.listaChequeo,
            evidenciasIds,
            form.observaciones
        ];
        qResult = await dataSource.insertData(query, params);
    }
    catch(err){
        qResult = new dataSource.QueryResult(false, [], 0,0, err.message);
    }
    return qResult;
}


/**
 * @param {*} form
 * @returns
 */

async function insertFaunaBusquedaLibre(form, idUsuario)
{
    let qResult;
    const consult = await insertformInicial(form.estadoTiempo, form.estacion, form.tipoRegistro, idUsuario);
    if(!consult.success)
    {
        return consult;
    }
    const idRegistro = consult.gen_id;
    try
    {
        let evidenciasIds = null;
        if(form.evidencias && Array.isArray(form.evidencias) && form.evidencias.length > 0)
        {
            const imagesResult = await processEvidencias(form.evidencias, idUsuario, idRegistro);
            if(imagesResult.getStatus())
            {
                evidenciasIds = imagesResult.getRows().map(row => row.idImagen).join(',');
            }
        }
        let query = "INSERT INTO fauna_busqueda_libre (idRegistro, zona, tipoAnimal nombreComun, nombreCientifico, numeroIndividuos, tipoObservacion, alturaObservacion, evidencias, observaciones) VALUES (?,?,?,?,?,?,?,?,?,?)";
        let params = [
            idRegistro,
            form.zona,
            form.tipoAnimal,
            form.nombreComun,
            form.nombreCientifico,
            form.numeroIndividuos,
            form.tipoObservacion,
            form.alturaObservacion,
            evidenciasIds,
            form.observaciones
        ];
        qResult = new dataSource.insertData(query, params);
    }catch(err){
        qResult = new dataSource.QueryResult(false, [],0,0,err.message);
    }
    return qResult;
}

/**
 * @param {*} form
 * @returns
 */

async function insertFaunaPuntoConteo(form, idUsuario)
{
    let qResult;
    const consult = await insertformInicial(form.estadoTiempo, form.estacion, form.tipoRegistro, idUsuario);
    if(!consult.success)
    {
        return consult;
    }
    const idRegistro = consult.gen_id;
    try
    {
        let evidenciasIds = null;
        if(form.evidencias && Array.isArray(form.evidencias) && form.evidencias.length > 0) 
        {
            const imagesResult = await processEvidencias(form.evidencias, idUsuario, idRegistro);
            if(imagesResult.getStatus())
            {
                evidenciasIds = imagesResult.getRows().map(row => row.idImagen).join(',');
            }
        }
        let query = "INSERT INTO fauna_punto_conteo (idRegistro, form.zona, form.tipoAnimal, form.nombreComun, form.nombreCientifico, numeroIndividuos, tipoObservacion, alturaObservacion, evidencias, observaciones) VALUES (?,?,?,?,?,?,?,?,?,?)";
        let params = [
            idRegistro,
            form.zona,
            form.tipoAnimal,
            form.nombreComun,
            form.nombreCientifico,
            form.numeroIndividuos,
            form.tipoObservacion,
            form.alturaObservacion,
            evidenciasIds,
            form.observaciones
        ]
        qResult = await dataSource.insertData(query, params);
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [], 0,0, err.message);
    }
    return qResult;
}

/**
 * @param {*} form
 * @returns
 */
async function insertFaunaTransecto(form, idUsuario)
{
    let qResult;
    const consult = await insertformInicial(form.estadoTiempo, form.estacion, form.tipoRegistro, idUsuario);
    if(!consult.success)
    {
        return consult;
    }
    const idRegistro = consult.gen_id;
    try
    {
        let evidenciasIds = null;
        if(form.evidencias && Array.isArray(form.evidencias) && form.evidencias.lengtth > 0)
        {
            const imagesResult = await processEvidencias(form.evidencias, idUsuario, idRegistro);
            if(imagesResult.getStatus())
            {
                evidenciasIds = imagesResult.getRows().map(row => row.idImagen).join(',');
            }
        }
        let query = "INSERT INTO fauna_transecto (idRegistro, numeroTransecto, tipoAnimal, nombreComun, nombreCientifico, nroIndividuos, tipoObservacion, evidencias, observaciones) VALUES  (?,?,?,?,?,?,?,?,?)";
        let params = [
            idRegistro,
            form.numeroTransecto,
            form.tipoAnimal,
            form.nombreComun,
            form.nombreCientifico,
            form.nroIndividuos,
            form.tipoObservacion,
            evidenciasIds,
            form.observaciones
        ];
        qResult = await dataSource.insertData(query, params);
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [],0,0,err.message);
    }
    return qResult;
}


/**
 * @param {*} form
 * @returns
 */
async function insertValidacionCobertura(form, idUsuario)
{
    let qResult;
    const consult = await insertformInicial(form.estadoTiempo, form.estacion, form.tipoRegistro, idUsuario);
    if(!consult.success)
    {
        return consult;
    }
    const idRegistro = consult.gen_id;
    try
    {
        let evidenciasIds = null;
        if(form.evidencias && Array.isArray(form.evidencias) && form.evidencias.length > 0)
        {
            const imagesResult = await processEvidencias(form.evidencias, idUsuario, idRegistro);
            if(imagesResult.getStatus())
            {
                evidenciasIds = imagesResult.getRows().map(row => row.idImagen).join(',');
            }
        }
        let query = "INSERT INTO validacion_cobertura (idRegistro, codigo, seguimiento, cambio, cobertura, tiposCultivo, disturbio, evidencias, observaciones) VALUES (?,?,?,?,?,?,?,?,?)";
        let params = [
            idRegistro,
            form.codigo,
            form.seguimiento,
            form.cambio,
            form.cobertura,
            form.tiposCultivo,
            form.disturbio,
            evidenciasIds,
            form.observaciones
        ]
        qResult = await dataSource.insertData(query, params);
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [],0,0,err.message);
    }
    return qResult;
}

/**
 * @param {*} form
 * returns
 */
async function insertParcelaVegetacion(form, idUsuario)
{
    let qResult;
    const consult = await insertformInicial(form.estadoTiempo, form.estacion, form.tipoRegistro, idUsuario);
    if(!consult.success)
    {
        return consult;
    }
    const idRegistro = consult.gen_id;
    try
    {
        let evidenciasIds = null;
        if(form.evidencias && Array.isArray(form.evidencias) && form.evidencias.length > 0)
        {
            const imagesResult = await processEvidencias(form.evidencias, idUsuario, idRegistro);
            if(imagesResult.getStatus())
            {
                evidenciasIds = imagesResult.getRows().map(row => row.idImagen).join(',');
            }
        }
        query = "INSERT INTO parcela_vegetacion (idRegistro, cuadrante, subcuadrante, habitoCrecimiento, nombreComun, nombreCientifico, placa, circunferencias, distanciaMt, estaturaBiomonitorMt, alturaMt, evidencias, observaciones) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
        let params = [
            idRegistro,
            form.cuadrante,
            form.subcuadrante,
            form.habitoCrecimiento,
            form.nombreComun,
            form.nombreCientifico,
            form.placa,
            form.circunferencias,
            form.distanciaMt,
            form.estaturaBiomonitorMt,
            form.alturaMt,
            evidenciasIds,
            form.observaciones
        ];
        qResult= await dataSource.insertData(query, params);
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [], 0,0, err.message);
    }
    return qResult;
}

module.exports = {
    insertVClimaticas,
    insertCamarasTrampa,
    insertFaunaTransecto,
    insertFaunaBusquedaLibre,
    insertFaunaPuntoConteo,
    insertValidacionCobertura,
    insertParcelaVegetacion,
    processEvidencias
}