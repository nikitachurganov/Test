import type { Request, Response, NextFunction } from 'express';
import { getAllForms, createForm } from '../storage/forms.store';
import type { CreateFormDto } from '../types/form.types';

// GET /api/forms
export const listForms = (_req: Request, res: Response): void => {
  res.json(getAllForms());
};

// POST /api/forms
export const addForm = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const body = req.body as Partial<CreateFormDto>;

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      res
        .status(400)
        .json({ error: '"name" is required and must be a non-empty string' });
      return;
    }

    const form = createForm({
      name: body.name.trim(),
      description: body.description,
      fields: body.fields,
    });

    res.status(201).json(form);
  } catch (err) {
    next(err);
  }
};
