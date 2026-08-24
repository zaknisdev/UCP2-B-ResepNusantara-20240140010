const express = require('express');
const apiKeyController = require('../controllers/apikey.controller');
const authJwt = require('../middleware/auth.jwt');

const router = express.Router();

router.use(authJwt);

router.post('/', apiKeyController.generate);
router.get('/', apiKeyController.list);
router.delete('/:id', apiKeyController.revoke);

module.exports = router;
