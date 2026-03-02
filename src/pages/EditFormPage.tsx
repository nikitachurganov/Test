import { useEffect, useMemo, useState } from 'react';
import { Alert, Spin, notification, theme } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getFormById,
  updateForm,
  mapFieldsToPayload,
  payloadToInstance,
  type FormResponse,
} from '../shared/api/forms.api';
import { FormEditor } from '../shared/ui/form-builder/FormEditor';
import type { FormFieldInstance } from '../shared/types/form-builder.types';

export const EditFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();

  const [formData, setFormData] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFormById(id)
      .then((data) => {
        setFormData(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить форму');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Convert stored payload fields → FormFieldInstance once per load.
  // FormEditor is only mounted after loading finishes, so these are stable.
  const initialFields = useMemo<FormFieldInstance[]>(
    () => (formData?.fields ?? []).map(payloadToInstance),
    [formData],
  );

  const handleSave = async (title: string, fields: FormFieldInstance[]) => {
    if (!id) return;

    await updateForm(id, {
      name: title,
      fields: mapFieldsToPayload(fields),
    });

    notification.success({
      message: 'Форма обновлена',
      description: `Форма «${title}» успешно обновлена.`,
      placement: 'topRight',
    });

    navigate(`/forms/${id}`);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          background: token.colorBgLayout,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div style={{ padding: 24, background: token.colorBgLayout, flex: 1 }}>
        <Alert
          type="error"
          showIcon
          message="Ошибка загрузки"
          description={error ?? 'Форма не найдена'}
        />
      </div>
    );
  }

  return (
    <FormEditor
      breadcrumbLabel="Редактирование формы"
      pageTitle="Редактирование формы"
      saveButtonLabel="Обновить"
      initialTitle={formData.name}
      initialFields={initialFields}
      onSave={handleSave}
      onBack={() => navigate('/forms')}
    />
  );
};
