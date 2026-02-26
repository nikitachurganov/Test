import { useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Spin, Typography, theme } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getForms, type FormResponse } from '../shared/api/forms.api';

const { Text, Title } = Typography;

// ─── Individual form card ────────────────────────────────────────────────────

interface FormCardProps {
  form: FormResponse;
  onOpen: (id: string) => void;
}

const FormCard = ({ form, onOpen }: FormCardProps) => {
  const { token } = theme.useToken();

  const createdAt = new Date(form.created_at).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card
      hoverable
      style={{ display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8 } }}
      actions={[
        <Button key="open" type="link" onClick={() => onOpen(form.id)}>
          Редактировать
        </Button>,
      ]}
    >
      <Title
        level={5}
        style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        title={form.name}
      >
        {form.name}
      </Title>

      {form.description ? (
        <Text
          type="secondary"
          style={{
            fontSize: token.fontSizeSM,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {form.description}
        </Text>
      ) : (
        <Text type="secondary" italic style={{ fontSize: token.fontSizeSM }}>
          Без описания
        </Text>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          {form.fields.length} {pluralizeFields(form.fields.length)} · {createdAt}
        </Text>
      </div>
    </Card>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pluralizeFields(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'поле';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'поля';
  return 'полей';
}

// ─── Page ────────────────────────────────────────────────────────────────────

export const FormsPage = () => {
  const navigate = useNavigate();

  const [forms, setForms] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getForms()
      .then((data) => {
        setForms(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Не удалось загрузить формы',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          type="error"
          showIcon
          message="Ошибка загрузки"
          description={error}
          style={{ margin: '8px 0' }}
        />
      );
    }

    if (forms.length === 0) {
      return (
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Empty
            description="Форм пока нет. Создайте первую!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          alignContent: 'start',
        }}
      >
        {forms.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            onOpen={(id) => navigate(`/forms/${id}/edit`)}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0 }}>
      <Card
        title="Формы"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/forms/create')}
          >
            Создать форму
          </Button>
        }
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
        }}
        styles={{
          body: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            minHeight: 0,
            overflowY: 'auto',
            padding: 24,
          },
        }}
      >
        {renderContent()}
      </Card>
    </div>
  );
};
