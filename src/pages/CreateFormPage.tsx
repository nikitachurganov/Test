import { notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createForm, mapFieldsToPayload } from '../shared/api/forms.api';
import { FormEditor } from '../shared/ui/form-builder/FormEditor';
import type { FormFieldInstance } from '../shared/types/form-builder.types';

export const CreateFormPage = () => {
  const navigate = useNavigate();

  const handleSave = async (title: string, fields: FormFieldInstance[]) => {
    await createForm({
      name: title,
      fields: mapFieldsToPayload(fields),
    });

    notification.success({
      message: 'Форма сохранена',
      description: `Форма «${title}» успешно создана.`,
      placement: 'topRight',
    });

    navigate('/forms');
  };

  return (
    <FormEditor
      breadcrumbLabel="Создание новой формы"
      pageTitle="Новая форма"
      saveButtonLabel="Сохранить"
      onSave={handleSave}
      onBack={() => navigate('/forms')}
    />
  );
};
