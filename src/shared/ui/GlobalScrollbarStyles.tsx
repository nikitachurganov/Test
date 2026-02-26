import { theme } from 'antd';

/**
 * Injects a global <style> block that gives every scrollable area a thin,
 * rounded, minimalistic scrollbar.
 *
 * Colors are resolved at runtime from Ant Design theme tokens so they
 * automatically adapt to light / dark mode — no HEX values, no manual
 * theme branching.
 *
 * Must be rendered inside an Ant Design <ConfigProvider>.
 */
export const GlobalScrollbarStyles = () => {
  const { token } = theme.useToken();

  /*
   * token.colorTextQuaternary  → subtle semi-transparent neutral (default thumb)
   * token.colorTextTertiary    → slightly stronger neutral (hover thumb)
   *
   * In light mode these resolve to roughly rgba(0,0,0, 0.25) and rgba(0,0,0, 0.45).
   * In dark  mode they resolve to roughly rgba(255,255,255, 0.25) and rgba(255,255,255, 0.45).
   * The algorithm handles the inversion — no conditional logic needed here.
   */
  const thumb = token.colorTextQuaternary;
  const thumbHover = token.colorTextTertiary;

  const css = `
    /* ── Webkit: Chrome · Edge · Safari ─────────────────────────────────── */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: ${thumb};
      border-radius: 999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${thumbHover};
    }
    /* ── Firefox ─────────────────────────────────────────────────────────── */
    * {
      scrollbar-width: thin;
      scrollbar-color: ${thumb} transparent;
    }
  `;

  return <style data-purpose="global-scrollbar">{css}</style>;
};
