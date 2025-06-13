const dataSource = require('../Datasource/MySQLMngr');
const hashService = require('./hashPassword');
const imageService = require('./imageUploadService');
require('dotenv').config();
/** 
 * @returns
 */
async function getUsers(){
    let qResult;
    try{
        let query = `SELECT u.idUsuario, u.Nombre, u.Apellidos, u.email, u.rol, u.estado, count(fi.idCreador) as TotalRegistros
        FROM usuario u left join formularioinicial fi on fi.idCreador = u.idUsuario
        WHERE u.estado = ?
        group by u.idUsuario, u.Nombre, u.Apellidos, u.email, u.rol, u.estado
        order by u.idUsuario
        `;
        let params = ['A'];
        qResult = await dataSource.getDataWithParams(query, params);
    }catch(err){
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}

/**
 * @param {int} idUsuario
 * @returns
 */
async function findUser(idUsuario){
    let qResult;
    try{
        let query = "SELECT * FROM usuario WHERE idUsuario = ?";
        let params = [idUsuario];
        qResult = await dataSource.getDataWithParams(query, params);
    }catch(err){
        qResult = new dataSource.QueryResult(false,[],0,0,err.message);
    }
    return qResult;
}
async function getValores(email)
{
    let qResult;
    try
    {
        let query = "SELECT estado, rol FROM usuario WHERE email = ?";
        let params = [email];
        qResult = await dataSource.getDataWithParams(query, params);
    }
    catch(err)
    {
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}

/**
 * @param {*} user
 * @returns
 */

/*la logica ser que, cheque si el usuario tiene imagen
Si si la tiene, la subira a la base de datos en la tabla imagenes con el idUser. Si no la tiene, le asignara una default que estara ya en la DB
Despues, alterara el registro del usuario insertado en la tabla usuario, para que tenga el ID de imagen que le corresponde*/
async function insertUser(user){
    let qResult;
    try{
        let query = "INSERT INTO usuario (Nombre, Apellidos, email, password, pais, numerotel, region, ciudad, nombreOrganizacion, descOrganizacion, rol, estado, idResponsable) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
        const salt = hashService.getSalt();
        const hash = await hashService.encryptPassword(user.password, salt);
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
            user.rol,
            user.estado,
            user.idResponsable
        ];
        qResult = await dataSource.insertData(query, params);
        /***/
        const idUser = qResult.getGenId();
        let idImagen = 1;
        console.log('📦 user.imagen recibido:', user.imagen);
        if(user.imagen)
        {
            let imageObj = {...user.imagen, usuario_carga: idUser};
            let qResultImg = await imageService.uploadedImageLog(imageObj);
            if (qResultImg && qResultImg.getStatus()) {
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
            if (qResultImg && qResultImg.getStatus()) {
                idImagen = qResultImg.getGenId();
            }
        }
        let query2 = "UPDATE usuario SET idImagen = ? WHERE idUsuario = ?";
        let params2 = [idImagen, idUser];
        await dataSource.updateData(query2, params2);
        return new dataSource.QueryResult(true, [idUser, idImagen],1, qResult.getGenId());
    }
    catch(err){
        console.error('Error al insertar usuario:', err.message);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

/**
 * @param {*} user
 * @returns
 */
async function updateUser(user, idUsuario){
    let qResult;
    try{
        let query = "UPDATE usuario SET Nombre = ?, Apellidos = ?, email = ?, password = ?, pais = ?, numerotel = ?, region = ?, ciudad = ?, nombreOrganizacion = ?, descOrganizacion = ? WHERE idUsuario = ?";

        let params = [
            user.Nombre,
            user.Apellidos,
            user.email,
            user.password,
            user.pais,
            user.numerotel,
            user.region,
            user.ciudad,
            user.nombreOrganizacion,
            user.descOrganizacion,
            idUsuario
        ];
        qResult = await dataSource.updateData(query, params);
    }catch(err){
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}
/**
 * @param {int} user_id
 * @returns
 */
async function deleteUser(user_id){
    let qResult;
    try{
        let query = "DELETE FROM usuario WHERE idUsuario = ?";
        let params = [user_id];
        qResult = await dataSource.deleteUser(query, params);
    }catch(err){
        qResult = new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}
/**
 * @param {*} Conv
 * @param {int} idUsuario
 * @returns
 */
async function insertConvocatorias(Conv, idUsuario){
    let qResult;
    try{
        let query = "INSERT INTO convocatorias (nombreConv, FechaCierre, sitio_web, region, organizacion, pais, descripcion, idUsuario) VALUES (?,?,?,?,?,?,?,?)";
        let params = [
            Conv.nombreConv,
            Conv.FechaCierre,
            Conv.sitio_web,
            Conv.region,
            Conv.organizacion,
            Conv.pais,
            Conv.descripcion,
            idUsuario
        ];
        qResult = await dataSource.insertData(query, params);
        return new dataSource.QueryResult(true, [Conv.idConvocatoria], 1, qResult.getGenId());
    }
    catch(err){
        console.error('Error al insertar convocatoria:', err.message);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

async function getConvocatoriasAbiertas() {
    let qResult;
    try {
        let query = "SELECT * FROM convocatorias WHERE FechaCierre > NOW()";
        qResult = await dataSource.getData(query);
        return new dataSource.QueryResult(true, qResult.getRows(), qResult.getRows().length, 0);
    }
    catch(err) {
        console.error('Error al obtener convocatorias abiertas:', err.message);
        return new dataSource.QueryResult(false,  [], 0, 0, err.message);
    }
}

async function getConvocatoriasCerradas() {
    let qResult;
    try {
        let query = "SELECT * FROM convocatorias WHERE FechaCierre <= NOW()";
        qResult = await dataSource.getData(query);
        return new dataSource.QueryResult(true, qResult.getRows(), qResult.getRows().length, 0);
    }
    catch(err) {
        console.error('Error al obtener convocatorias cerradas:', err.message);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

// Obtener biomos del usuario
// ✅ CORREGIR: getUserBiomos - usar la tabla correcta
async function getUserBiomos(idUsuario) {
    let qResult;
    try {
        let query = `
            SELECT idFormIn AS idBiomo, tipoRegistro 
            FROM formularioinicial 
            WHERE idCreador = ?
        `;
        let params = [idUsuario];
        qResult = await dataSource.getDataWithParams(query, params);
        return new dataSource.QueryResult(true, qResult.getRows(), qResult.getRows().length, 0);
    } catch (err) {
        console.error('Error al obtener biomos del usuario:', err.message);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

// Crear anteproyecto
// ✅ CORREGIR: insertAnteproyecto - usar nombres de columnas correctos
async function insertAnteproyecto(anteproyecto, idUsuario) {
    let qResult;
    try {
        // Generar nombre automático para el PDF
        const fechaActual = new Date();
        const fechaFormateada = fechaActual.toISOString().split('T')[0]; // YYYY-MM-DD
        const nombreAnteproyecto = `Anteproyecto_Conv${anteproyecto.idConvocatoria}_${fechaFormateada}_${Date.now()}.pdf`;
        
        let query = `
            INSERT INTO anteproyectos (nombre, idconvocatoria) 
            VALUES (?, ?)
        `;
        let params = [
            nombreAnteproyecto,
            anteproyecto.idConvocatoria
        ];
        qResult = await dataSource.insertData(query, params);
        return new dataSource.QueryResult(true, [qResult.getGenId()], 1, qResult.getGenId());
    } catch (err) {
        console.error('Error al insertar anteproyecto:', err.message);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

// Asociar biomos a anteproyecto
// ✅ CORREGIR: insertAnteproyectoBiomos - arreglar template literal y tabla
// ✅ CORREGIR: insertAnteproyectoBiomos con debugging extensivo
async function insertAnteproyectoBiomos(idAnteproyecto, biomoIds) {
    try {
        console.log('🔍 === INICIO insertAnteproyectoBiomos ===');
        console.log('🆔 idAnteproyecto:', idAnteproyecto, typeof idAnteproyecto);
        console.log('📋 biomoIds:', biomoIds, Array.isArray(biomoIds));
        console.log('📋 biomoIds length:', biomoIds?.length);
        
        if (!idAnteproyecto || !biomoIds || !Array.isArray(biomoIds) || biomoIds.length === 0) {
            console.log('❌ Parámetros inválidos');
            console.log('- idAnteproyecto:', !!idAnteproyecto);
            console.log('- biomoIds exists:', !!biomoIds);
            console.log('- biomoIds is array:', Array.isArray(biomoIds));
            console.log('- biomoIds length > 0:', biomoIds?.length > 0);
            return new dataSource.QueryResult(false, [], 0, 0, 'Parámetros inválidos para insertAnteproyectoBiomos');
        }

        // ✅ VERIFICAR QUE LA TABLA EXISTE
        try {
            const testQuery = "SHOW TABLES LIKE 'anteproyectobiomo'";
            const testResult = await dataSource.getData(testQuery);
            console.log('🔍 Tabla anteproyectobiomo existe:', testResult.getRows().length > 0);
            
            if (testResult.getRows().length === 0) {
                console.log('❌ La tabla anteproyectobiomo no existe');
                return new dataSource.QueryResult(false, [], 0, 0, 'La tabla anteproyectobiomo no existe');
            }
        } catch (tableError) {
            console.error('❌ Error verificando tabla:', tableError);
        }

        let insertedCount = 0;
        const errors = [];
        const successes = [];

        console.log('🔄 Iniciando inserción de biomos...');

        for (let i = 0; i < biomoIds.length; i++) {
            const idBiomo = biomoIds[i];
            console.log(`\n--- Procesando biomo ${i + 1}/${biomoIds.length} ---`);
            console.log(`🆔 idAnteproyecto: ${idAnteproyecto} (${typeof idAnteproyecto})`);
            console.log(`🧬 idBiomo: ${idBiomo} (${typeof idBiomo})`);
            
            try {
                // ✅ VERIFICAR QUE EL BIOMO EXISTE
                const checkBiomoQuery = "SELECT idFormIn FROM formularioinicial WHERE idFormIn = ?";
                const checkBiomoResult = await dataSource.getDataWithParams(checkBiomoQuery, [idBiomo]);
                
                if (checkBiomoResult.getRows().length === 0) {
                    console.log(`❌ El biomo ${idBiomo} no existe en formularioinicial`);
                    errors.push(`Biomo ${idBiomo} no existe`);
                    continue;
                }
                
                console.log(`✅ Biomo ${idBiomo} existe en formularioinicial`);

                // ✅ VERIFICAR QUE NO EXISTA YA LA RELACIÓN
                const checkRelationQuery = "SELECT * FROM anteproyectobiomo WHERE id_anteproyecto = ? AND id_biomo = ?";
                const checkRelationResult = await dataSource.getDataWithParams(checkRelationQuery, [idAnteproyecto, idBiomo]);
                
                if (checkRelationResult.getRows().length > 0) {
                    console.log(`⚠️ La relación anteproyecto ${idAnteproyecto} - biomo ${idBiomo} ya existe`);
                    insertedCount++; // Contar como exitoso aunque ya existía
                    successes.push(`Biomo ${idBiomo} (ya existía)`);
                    continue;
                }

                // ✅ INSERTAR LA RELACIÓN
                const insertQuery = "INSERT INTO anteproyectobiomo (id_anteproyecto, id_biomo) VALUES (?, ?)";
                const insertParams = [idAnteproyecto, idBiomo];
                
                console.log('🔍 Query a ejecutar:', insertQuery);
                console.log('🔍 Parámetros:', insertParams);
                
                const insertResult = await dataSource.insertData(insertQuery, insertParams);
                console.log('📝 Resultado de inserción:', insertResult);
                console.log('📝 Insert ID:', insertResult.getGenId ? insertResult.getGenId() : 'N/A');
                
                insertedCount++;
                successes.push(`Biomo ${idBiomo}`);
                console.log(`✅ Biomo ${idBiomo} insertado correctamente`);
                
            } catch (error) {
                console.error(`💥 Error insertando biomo ${idBiomo}:`, error);
                console.error('💥 Error completo:', error.message);
                console.error('💥 Stack trace:', error.stack);
                errors.push(`Biomo ${idBiomo}: ${error.message}`);
            }
        }

        console.log('\n🏁 === RESUMEN FINAL ===');
        console.log(`📊 Total biomos procesados: ${biomoIds.length}`);
        console.log(`✅ Insertados exitosamente: ${insertedCount}`);
        console.log(`❌ Errores: ${errors.length}`);
        console.log(`🎯 Éxitos: ${successes.join(', ')}`);
        
        if (errors.length > 0) {
            console.log('❌ Lista de errores:', errors);
        }

        if (insertedCount === 0) {
            console.log('❌ No se insertó ningún biomo');
            return new dataSource.QueryResult(false, [], 0, 0, 'No se pudo insertar ningún biomo: ' + errors.join(', '));
        }

        const finalResult = new dataSource.QueryResult(true, successes, insertedCount, 0);
        console.log('✅ Retornando resultado exitoso:', finalResult);
        return finalResult;
        
    } catch (err) {
        console.error('💥 Error general en insertAnteproyectoBiomos:', err);
        console.error('💥 Error message:', err.message);
        console.error('💥 Error stack:', err.stack);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

// Obtener anteproyectos abiertos (usando la fechaCierre de la convocatoria)
// ✅ CORREGIR: getAnteproyectosAbiertos - usar nombres de columnas correctos
async function getAnteproyectosAbiertos() {
    let qResult;
    try {
        let query = `
            SELECT 
                a.id_anteproyecto AS idAnteproyecto,
                a.nombre,
                a.idconvocatoria AS idConvocatoria,
                c.nombreConv AS nombreConvocatoria, 
                c.FechaCierre,
                'abierto' AS estado
            FROM anteproyectos a 
            JOIN convocatorias c ON a.idconvocatoria = c.id_convocatoria 
            WHERE c.FechaCierre > NOW()
            ORDER BY a.id_anteproyecto DESC
        `;
        qResult = await dataSource.getData(query);
        return new dataSource.QueryResult(true, qResult.getRows(), qResult.getRows().length, 0);
    } catch (err) {
        console.error('Error al obtener anteproyectos abiertos:', err.message);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

// Obtener anteproyectos cerrados
// ✅ CORREGIR: getAnteproyectosCerrados - usar nombres de columnas correctos
async function getAnteproyectosCerrados() {
    let qResult;
    try {
        let query = `
            SELECT 
                a.id_anteproyecto AS idAnteproyecto,
                a.nombre,
                a.idconvocatoria AS idConvocatoria,
                c.nombreConv AS nombreConvocatoria, 
                c.FechaCierre,
                'cerrado' AS estado
            FROM anteproyectos a 
            JOIN convocatorias c ON a.idconvocatoria = c.id_convocatoria 
            WHERE c.FechaCierre <= NOW()
            ORDER BY a.id_anteproyecto DESC
        `;
        qResult = await dataSource.getData(query);
        return new dataSource.QueryResult(true, qResult.getRows(), qResult.getRows().length, 0);
    } catch (err) {
        console.error('Error al obtener anteproyectos cerrados:', err.message);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

// ✅ NUEVO: Obtener anteproyecto con sus biomos asociados
async function getAnteproyectoWithBiomos(idAnteproyecto) {
    let qResult;
    try {
        let query = `
            SELECT 
                a.*,
                c.nombreConv AS nombreConvocatoria,
                c.FechaCierre,
                GROUP_CONCAT(ab.idBiomo) AS biomoIds,
                GROUP_CONCAT(fi.tipoRegistro) AS tipoRegistros
            FROM anteproyectos a
            JOIN convocatorias c ON a.idConvocatoria = c.idConvocatoria
            LEFT JOIN anteproyecto_biomos ab ON a.idAnteproyecto = ab.idAnteproyecto
            LEFT JOIN formularioinicial fi ON ab.idBiomo = fi.idFormIn
            WHERE a.idAnteproyecto = ?
            GROUP BY a.idAnteproyecto
        `;
        let params = [idAnteproyecto];
        qResult = await dataSource.getDataWithParams(query, params);
        return new dataSource.QueryResult(true, qResult.getRows(), qResult.getRows().length, 0);
    } catch (err) {
        console.error('Error al obtener anteproyecto con biomos:', err.message);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}
async function getAnteproyectoById(idAnteproyecto) {
    let qResult;
    try {
        console.log('🔍 Service: getAnteproyectoById:', idAnteproyecto);
        
        // Query para obtener el anteproyecto específico
        let query = `
            SELECT 
                a.id_anteproyecto AS idAnteproyecto,
                a.nombre,
                a.idconvocatoria AS idConvocatoria,
                c.nombreConv AS nombreConvocatoria, 
                c.FechaCierre
            FROM anteproyectos a 
            JOIN convocatorias c ON a.idconvocatoria = c.id_convocatoria 
            WHERE a.id_anteproyecto = ?
        `;
        
        console.log('🔍 Query:', query);
        console.log('🔍 Params:', [idAnteproyecto]);
        
        qResult = await dataSource.getDataWithParams(query, [idAnteproyecto]);
        console.log('📋 Resultado query:', qResult.getRows());
        
        if (qResult.getRows().length === 0) {
            console.log('❌ No se encontró anteproyecto con ID:', idAnteproyecto);
            return new dataSource.QueryResult(false, [], 0, 0, 'Anteproyecto no encontrado');
        }
        
        console.log('✅ Anteproyecto encontrado:', qResult.getRows()[0]);
        return new dataSource.QueryResult(true, qResult.getRows(), qResult.getRows().length, 0);
        
    } catch (err) {
        console.error('💥 Error al obtener anteproyecto:', err);
        return new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
}

// Exportar funciones
// ✅ ACTUALIZAR: Exportar todas las funciones
module.exports = {
    getUsers,
    findUser,
    insertUser,
    updateUser,
    deleteUser,
    getValores,
    insertConvocatorias,
    getConvocatoriasAbiertas,
    getConvocatoriasCerradas,
    getUserBiomos,
    insertAnteproyecto,
    insertAnteproyectoBiomos,
    getAnteproyectosAbiertos,
    getAnteproyectosCerrados,
    getAnteproyectoWithBiomos,
    getAnteproyectoById
}