import { useMemo, useState } from 'react';
import { Input, Typography, theme } from 'antd';
import { DraggableFieldItem } from './form-builder/DraggableFieldItem';

const { Text } = Typography;

// ─── Token-based color config for tool-panel field groups ─────────────────────

/** Constrains config keys to valid Ant Design GlobalToken property names */
type TokenKey = keyof ReturnType<typeof theme.useToken>['token'];

interface FieldGroupMeta {
  type: string;
  label: string;
  icon: string;
  iconColorToken: TokenKey;
  iconBgToken: TokenKey;
}

/**
 * Maps each tool-panel category to its icon color tokens.
 * Semantic tokens automatically adapt to light/dark mode —
 * no HEX values, no manual theme branching.
 */
const FIELD_GROUP_META: Record<string, FieldGroupMeta> = {
  'Структура': {
    type: 'structure',
    label: 'Структура',
    icon: 'material-symbols:folder-open',
    iconColorToken: 'colorTextSecondary',
    iconBgToken: 'colorFillSecondary',
  },
  'Основные поля': {
    type: 'basic',
    label: 'Основные поля',
    icon: 'material-symbols:text-fields',
    iconColorToken: 'colorPrimary',
    iconBgToken: 'colorPrimaryBg',
  },
  'Контактная информация': {
    type: 'contact',
    label: 'Контактная информация',
    icon: 'material-symbols:person',
    iconColorToken: 'colorSuccess',
    iconBgToken: 'colorSuccessBg',
  },
  'Дата и время': {
    type: 'datetime',
    label: 'Дата и время',
    icon: 'material-symbols:calendar-today',
    iconColorToken: 'colorWarning',
    iconBgToken: 'colorWarningBg',
  },
  'Поля загрузки файлов': {
    type: 'file',
    label: 'Поля загрузки файлов',
    icon: 'material-symbols:upload-file',
    iconColorToken: 'colorInfo',
    iconBgToken: 'colorInfoBg',
  },

};

// ─────────────────────────────────────────────────────────────────────────────

interface FieldTypeItem {
  key: string;
  label: string;
  iconName: string;
  category: string;
}

const ALL_FIELDS: FieldTypeItem[] = [
  {
    key: 'group',
    label: 'Группа полей',
    iconName: 'material-symbols:folder-open',
    category: 'Структура',
  },
  {
    key: 'input',
    label: 'Короткий текст',
    iconName: 'material-symbols:text-fields',
    category: 'Основные поля',
  },
  {
    key: 'textarea',
    label: 'Длинный текст',
    iconName: 'material-symbols:notes',
    category: 'Основные поля',
  },
  {
    key: 'select',
    label: 'Выпадающий список',
    iconName: 'material-symbols:arrow-drop-down-circle-outline',
    category: 'Основные поля',
  },
  {
    key: 'checkbox',
    label: 'Несколько вариантов',
    iconName: 'material-symbols:check-box-outline',
    category: 'Основные поля',
  },
  {
    key: 'radio',
    label: 'Один вариант',
    iconName: 'material-symbols:radio-button-checked',
    category: 'Основные поля',
  },
  {
    key: 'yesNo',
    label: 'Да / Нет',
    iconName: 'material-symbols:toggle-on',
    category: 'Основные поля',
  },
  {
    key: 'number',
    label: 'Число',
    iconName: 'material-symbols:pin',
    category: 'Основные поля',
  },
  {
    key: 'fullName',
    label: 'Полное имя',
    iconName: 'material-symbols:person',
    category: 'Контактная информация',
  },
  {
    key: 'phone',
    label: 'Номер телефона',
    iconName: 'material-symbols:phone',
    category: 'Контактная информация',
  },
  {
    key: 'email',
    label: 'Электронная почта',
    iconName: 'material-symbols:alternate-email',
    category: 'Контактная информация',
  },
  {
    key: 'date',
    label: 'Дата',
    iconName: 'material-symbols:calendar-today',
    category: 'Дата и время',
  },
  {
    key: 'dateTime',
    label: 'Дата и время',
    iconName: 'material-symbols:event',
    category: 'Дата и время',
  },
  {
    key: 'time',
    label: 'Время',
    iconName: 'material-symbols:schedule',
    category: 'Дата и время',
  },
  {
    key: 'fileUpload',
    label: 'Загрузка файла',
    iconName: 'material-symbols:upload-file',
    category: 'Поля загрузки файлов',
  },
  {
    key: 'address',
    label: 'Адрес',
    iconName: 'material-symbols:location-on',
    category: 'Контактная информация',
  },
];

// Unique categories in declaration order
const CATEGORIES = [...new Set(ALL_FIELDS.map((f) => f.category))];

export const ToolPanel = () => {
  const [search, setSearch] = useState('');
  const { token } = theme.useToken();

  const groupedByCategory = useMemo(() => {
    const query = search.toLowerCase().trim();
    const result: Record<string, FieldTypeItem[]> = {};

    for (const category of CATEGORIES) {
      const fields = ALL_FIELDS.filter(
        (f) => f.category === category && f.label.toLowerCase().includes(query),
      );
      if (fields.length > 0) {
        result[category] = fields;
      }
    }

    return result;
  }, [search]);

  const hasResults = Object.keys(groupedByCategory).length > 0;

  return (
    <div
      style={{
        display: 'flex',
        padding: '20px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 16,
        alignSelf: 'stretch',
      }}
    >
      {/* Title + Search */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignSelf: 'stretch',
        }}
      >
        <Text strong style={{ fontSize: 14 }}>
          Поля формы
        </Text>
        <Input.Search
          placeholder="Поиск поля"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Поиск по полям формы"
        />
      </div>

      {/* Grouped field list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          alignSelf: 'stretch',
        }}
      >
        {hasResults ? (
          Object.entries(groupedByCategory).map(([category, fields]) => (
            <div key={category}>
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                  color: token.colorTextQuaternary,
                }}
              >
                {category}
              </Text>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  rowGap: 4,
                  columnGap: 8,
                }}
              >
                {fields.map((item) => {
                  const meta = FIELD_GROUP_META[item.category];
                  return (
                    <DraggableFieldItem
                      key={item.key}
                      fieldKey={item.key}
                      label={item.label}
                      iconName={item.iconName}
                      iconColor={meta ? String(token[meta.iconColorToken]) : undefined}
                      iconBackground={meta ? String(token[meta.iconBgToken]) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <Text type="secondary">Поля не найдены</Text>
          </div>
        )}
      </div>
    </div>
  );
};
