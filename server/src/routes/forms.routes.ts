import { Router } from 'express';
import { listForms, addForm } from '../controllers/forms.controller';

export const formRoutes = Router();

// GET  /api/forms   — return all forms
formRoutes.get('/', listForms);

// POST /api/forms   — create a new form
formRoutes.post('/', addForm);
