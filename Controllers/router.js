const express = require('express');
//const templates = require('./Templates/templates');
const usersRest = require('./API/usersRestController');
const imageRest = require('./API/imageRestController');
const constants = require("../constants");
const adminRest = require('./API/SAdminRestController');
const formRest = require('./API/formRestController');
const aiChatRest = require('./API/aiChatController');
const authenticateToken = usersRest.authenticateToken;

const router = express.Router();

//rutas recoverpassword
router.post(constants.contextURL + constants.apiURL + "/send-recovery-email", usersRest.sendRecoveryEmail);
router.post(constants.contextURL + constants.apiURL + "/reset-password", usersRest.resetPassword);


//Rutas de la API
router.post(constants.contextURL + constants.apiURL + "/login", usersRest.execLogin);
router.get(constants.contextURL + constants.apiURL + "/getusers", usersRest.authenticateTokenAdmin, usersRest.getUsers);
router.get(constants.contextURL + constants.apiURL + "/findUser/:idUsuario", usersRest.authenticateToken, usersRest.findUser);
router.post(constants.contextURL + constants.apiURL + "/insertUser", usersRest.insertUser);
router.put(constants.contextURL + constants.apiURL + "/updateUser", usersRest.authenticateToken, usersRest.updateUser);
router.delete(constants.contextURL + constants.apiURL + "/deleteUser", usersRest.authenticateToken, usersRest.deleteUser);

//convocatorias
router.post(constants.contextURL + constants.apiURL + "/insertConvocatorias/:idUsuario", usersRest.authenticateToken, usersRest.insertConvocatorias);
router.get(constants.contextURL + constants.apiURL + "/getConvocatoriasAbiertas", usersRest.authenticateToken, usersRest.getConvocatoriasAbiertas);
router.get(constants.contextURL + constants.apiURL + "/getConvocatoriasCerradas", usersRest.authenticateToken, usersRest.getConvocatoriasCerradas);

//Imagen
router.post(constants.contextURL + constants.apiURL + "/imageUpload", usersRest.authenticateToken, imageRest.upload, imageRest.processUpload);
router.get(constants.contextURL + constants.apiURL + "/getUserProfileImage/:userId", usersRest.authenticateToken, imageRest.getUserProfileImage);
//forms
router.post(constants.contextURL + constants.apiURL + "/insertVClimaticas", usersRest.authenticateToken, formRest.insertVClimaticas);
router.post(constants.contextURL + constants.apiURL + "/insertCamarasTrampa", usersRest.authenticateToken, formRest.insertCamarasTrampa);
router.post(constants.contextURL + constants.apiURL + "/insertFaunaBusquedaLibre", usersRest.authenticateToken, formRest.insertFaunaBusquedaLibre);
router.post(constants.contextURL + constants.apiURL + "/insertFaunaPuntoConteo", usersRest.authenticateToken, formRest.insertFaunaPuntoConteo);
router.post(constants.contextURL + constants.apiURL + "/insertFaunaTransecto", usersRest.authenticateToken, formRest.insertFaunaTransecto);
router.post(constants.contextURL + constants.apiURL + "/insertValidacionCobertura", usersRest.authenticateToken, formRest.insertValidacionCobertura);
router.post(constants.contextURL + constants.apiURL + "/insertParcelaVegetacion", usersRest.authenticateToken, formRest.insertParcelaVegetacion);

//Admin routes
router.get(constants.contextURL + constants.apiURL + "/getRegistrosPorUsuario/:idUsuario", usersRest.authenticateTokenAdmin, adminRest.getRegistrosPorUsuario);
router.get(constants.contextURL + constants.apiURL + "/getRegistros/:idUsuario", usersRest.authenticateTokenAdmin, adminRest.getRegistros);

//Super admin
router.get(constants.contextURL + constants.apiURL + "/getUsersNA", usersRest.authenticateTokenSAdmin, adminRest.getUsersNoAceptados);
router.post(constants.contextURL + constants.apiURL + "/aceptarUsuario/:idUsuario", usersRest.authenticateTokenSAdmin, adminRest.AceptarUsuario);
router.post(constants.contextURL + constants.apiURL + "/rechazarUsuario/:idUsuario", usersRest.authenticateTokenSAdmin, adminRest.RechazarUsuario);
router.post(constants.contextURL + constants.apiURL + "/aceptarUsuariosAll", usersRest.authenticateTokenSAdmin, adminRest.AceptarUsuariosAll);
router.get(constants.contextURL + constants.apiURL + "/listpendientes", usersRest.authenticateTokenSAdmin, adminRest.getPendientes);
router.get(constants.contextURL + constants.apiURL + "/usuariosActivos", usersRest.authenticateTokenSAdmin, adminRest.usuariosActivos);
router.get(constants.contextURL + constants.apiURL + "/totalRegistros", usersRest.authenticateTokenSAdmin, adminRest.totalRegistros);
router.get(constants.contextURL + constants.apiURL + "/usuariosInactivos", usersRest.authenticateTokenSAdmin, adminRest.usuariosInactivos);
router.get(constants.contextURL + constants.apiURL + '/getUsersRechazados', adminRest.getUsersRechazados);
router.get(constants.contextURL + constants.apiURL + '/getRechazadosCount', adminRest.getRechazadosCount);
router.post(constants.contextURL + constants.apiURL + '/reactivarUsuario/:idUsuario', adminRest.reactivarUsuario);

// AI Chat routes
router.post(constants.contextURL + constants.apiURL + "/ai-chat", aiChatRest.aiChat);
router.get(constants.contextURL + constants.apiURL + "/ai-config", aiChatRest.getAiConfig);

//anteproyectos
router.get(constants.contextURL + constants.apiURL + "/getUserBiomos/:idUsuario", usersRest.authenticateToken, usersRest.getUserBiomos);
router.post(constants.contextURL + constants.apiURL + "/insertAnteproyecto/:idUsuario", usersRest.authenticateToken, usersRest.insertAnteproyecto);
router.get(constants.contextURL + constants.apiURL + "/getAnteproyectosAbiertos", usersRest.authenticateToken, usersRest.getAnteproyectosAbiertos);
router.get(constants.contextURL + constants.apiURL + "/getAnteproyectosCerrados", usersRest.authenticateToken, usersRest.getAnteproyectosCerrados);
router.get(constants.contextURL + constants.apiURL + "/getAnteproyectoPDF/:idAnteproyecto", usersRest.getAnteproyectoPDF);
router.put('/Consultas/api/update-password', authenticateToken, usersRest.updatePassword); // Requiere autenticación
router.post('/Consultas/api/reset-password', usersRest.resetPassword); // No requiere autenticación (usa token JWT)
router.post('/Consultas/api/send-recovery-email', usersRest.sendRecoveryEmail); // No requiere autenticación
module.exports = router;
