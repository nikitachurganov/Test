def normalize_name_part(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    return normalized or None


def build_display_name(
    *,
    last_name: str,
    first_name: str,
    middle_name: str | None = None,
) -> str:
    parts = [last_name.strip(), first_name.strip()]
    if middle_name:
        trimmed_middle = middle_name.strip()
        if trimmed_middle:
            parts.append(trimmed_middle)
    return " ".join(parts)
