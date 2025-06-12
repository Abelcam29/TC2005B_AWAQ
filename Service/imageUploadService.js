const dataSource = require('../Datasource/MySQLMngr');
const { QueryResult } = dataSource;
const fs = require('fs');
const path = require('path');
/**
 * 
 * @param {Array} images - Array 
 * @returns {Promise<QueryResult>} 
 */
async function uploadedImagesLog(images) {
    // Valida input
    if (!Array.isArray(images)) {
        return new QueryResult(false, [], 0, 0, 'Images must be provided as an array');
    }

    if (images.length === 0) {
        return new QueryResult(true, [], 0, 0, 'No images to insert');
    }

    try {
        
        const values = images.map(image => {
            if (!image.name || !image.usuario_carga) {
                throw new Error('Missing required fields (name or usuario_carga)');
            }
            return [
                image.name,
                image.usuario_carga
            ];
        });

        // MySQL bulk insert 
        const query = 'INSERT INTO imagenes (nombreImagen, usuario_carga) VALUES ?';

        console.log(`Attempting to insert ${values.length} images`);
        const result = await dataSource.bulkInsertData(query, [values]);

        if (!result.getStatus()) {
            throw new Error(result.getErr());
        }

        console.log(`Successfully inserted ${result.getChanges()} images`);
        return result;
    } catch (err) {
        console.error('Bulk image insert failed:', {
            error: err.message,
            stack: err.stack,
            failedCount: images.length
        });
        return new QueryResult(false, [], 0, 0, err.message);
    }
}

/**
 * 
 * @param {Object} image }
 * @returns {Promise<QueryResult>} -
 */
async function uploadedImageLog(image) {

    if (!image || typeof image !== 'object' || !image.base64 || !image.name || !image.usuario_carga) {
        return new QueryResult(false, [], 0, 0, 'Invalid image object');
    }

    try {
        const base64Data = image.base64.split(';base64,').pop();
        const uploadDir = path.join(__dirname, '../public/uploads/usuarios');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const sanitizedFilename = `${Date.now()}_${image.name.replace(/\s+/g, '_')}`;
        const filepath = path.join(uploadDir, sanitizedFilename);

        // Guarda la imagen en disco
        fs.writeFileSync(filepath, base64Data, { encoding: 'base64' });
        console.log('✅ Imagen guardada en disco:', filepath);

        // Inserta en la base de datos individualmente
        const query = 'INSERT INTO imagenes (nombreImagen, usuario_carga, idForm) VALUES (?, ?, ?)';
        const result = await dataSource.insertData(query, [sanitizedFilename, image.usuario_carga, image.idForm || null]);

        if (!result.getStatus()) {
            console.error("❌ Error insertando imagen:", result.getErr());
            return result;
        }

        console.log("✅ Imagen registrada con ID:", result.getGenId());
        return result;

    } catch (err) {
        console.error('❌ Error en uploadedImageLog:', {
        error: err,
        message: err?.message,
        stack: err?.stack
        });
        return new QueryResult(false, [], 0, 0, err.message);
    }
}

async function getUserProfileImage(userId) {
    if(!userId) {
        return new QueryResult(false, [], 0, 0, 'ID de usuario requerido');
    }

    try {
        const query = "SELECT i.nombreImagen FROM imagenes i JOIN usuario u ON i.idImagen = u.idImagen WHERE u.idUsuario = ? AND i.idForm IS NULL";
        const params = [userId];
        const result = await dataSource.getDataWithParams(query, params);
        
        if(result.getStatus() && result.getRows().length > 0) {
            return result;
        } else {
            return new QueryResult(false, [], 0, 0, 'No se encontro imagen de perfil');
        }
    }
    catch (err) {
        console.error('Error al obtener imagen de perfil;', err.message);
        return new QueryResult(false, [], 0, 0, err.message);
    }
}

async function defaultprofileImage(userId) {
    let qResult;
    try
    {
        const query = "INSERT INTO imagenes (nombreImagen, usuario_carga) VALUES (?, ?)";
        const defaultImage = "default.jpg";
        const params = [defaultImage, userId];
        qResult = await dataSource.insertData(query, params);
    }
    catch(err)
    {
        console.error('Error al insertar imagen por defecto:', err.message);
        qResult =  new dataSource.QueryResult(false, [], 0, 0, err.message);
    }
    return qResult;
}


module.exports = {
    uploadedImagesLog,
    uploadedImageLog,
    getUserProfileImage,
    defaultprofileImage
};