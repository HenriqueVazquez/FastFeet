import { Router } from 'express';
import multer from 'multer';
import multerConfigAvatar from './config/multerAvatar';
import multerConfigSignature from './config/multerSignature';

import SessionController from './app/controllers/SessionController';
import DeliverymanController from './app/controllers/DeliverymanController';
import DeliveryController from './app/controllers/DeliveryController';

import DeliverymanDeliveryController from './app/controllers/DeliverymanDeliveryController';
import DoneDeliveryController from './app/controllers/DoneDeliveryController';

import RecipientController from './app/controllers/RecipientController';
import FileAController from './app/controllers/FileAController';
import FileSController from './app/controllers/FileSController';

import DeliveryProblemController from './app/controllers/DeliveryProblemController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const uploadAvatar = multer(multerConfigAvatar);
const uploadSignature = multer(multerConfigSignature);

routes.post('/sessions', SessionController.store);

// Rota de uploads de signature
routes.post(
  '/files/signature',
  uploadSignature.single('file'),
  FileSController.store
);

// Rotas para entregadores verificarem suas entregas

routes.get('/deliveryman/:id/deliveries', DeliverymanDeliveryController.index);

// Rota para entregadores retirar a entrega

routes.put('/deliveryman/:id/delivery/withdrawal', DeliverymanDeliveryController.update);

//rota para entregador finalizar entrega

routes.put('/deliveryman/:id/delivery/done', DoneDeliveryController.update);


// Rotas para cadastrar problemas em entrega por entregadores

routes.post('/delivery/:id/problems', DeliveryProblemController.store);

routes.use(authMiddleware);
// Rotas abaixo serão verificadas os tokens

// Rotas de destinadorios
routes.post('/recipients', RecipientController.store);
routes.put('/recipients', RecipientController.update);

// Rotas de Entregadores
routes.post('/deliveryman', DeliverymanController.store);
routes.get('/deliverymen', DeliverymanController.index);
routes.get('/deliveryman/:id', DeliverymanController.show);
routes.put('/deliverymen/', DeliverymanController.update);
routes.delete('/deliveryman/:id', DeliverymanController.delete);

// Rotas de entrega

routes.post('/delivery', DeliveryController.store);
routes.get('/deliveries', DeliveryController.index);
routes.get('/delivery/:id', DeliveryController.show);
routes.put('/delivery', DeliveryController.update);
routes.delete('/delivery/:id', DeliveryController.delete);

// Rota de uploads de avatar
routes.post(
  '/files/avatar',
  uploadAvatar.single('file'),
  FileAController.store
);

// Rotas para problemas de entrega que precisam de token

routes.get('/deliveries/problems', DeliveryProblemController.index);
routes.get('/delivery/:id/problem', DeliveryProblemController.show);
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

export default routes;
