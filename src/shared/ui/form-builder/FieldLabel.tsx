interface FieldLabelProps {
  label: string;
  required?: boolean;
}

/**
 * Renders a field label for preview / view forms.
 * When required, appends a red asterisk after the label text.
 * Used as the `label` prop of Form.Item in place of the raw string so that
 * `requiredMark={false}` can be set on the Form while still showing the mark.
 */
export const FieldLabel = ({ label, required }: FieldLabelProps) => (
  <span>
    {label}
    {required && (
      <span style={{ marginLeft: 4 }} aria-hidden>
        *
      </span>
    )}
  </span>
);
