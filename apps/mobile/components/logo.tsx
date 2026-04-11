import Svg, { Rect } from "react-native-svg";

interface LogoProps {
  /** Width and height in points. Defaults to 32. */
  size?: number;
  /** Chip color. Defaults to brand amber. */
  color?: string;
  /** Cutout color (should match the surface behind the logo). Defaults to brand surface. */
  cutColor?: string;
  /**
   * Render the glyph without the chip background — just the amber mountain
   * on transparent. Useful in headers where you want the mark alone.
   */
  glyphOnly?: boolean;
}

const CHIP = "#f59e0b";
const CUT = "#0f0f14";

/**
 * Team Tally logo — Mountain-comb inside a chip.
 *
 * Same proportions as the Astro `ChipCombMountain.astro` component and the
 * source SVG in `assets/icons-src/`. If you edit this, edit the others too.
 */
export function Logo({ size = 32, color = CHIP, cutColor = CUT, glyphOnly = false }: LogoProps) {
  // In glyph-only mode, draw the comb in the chip color on transparent.
  const chipFill = glyphOnly ? "transparent" : color;
  const markFill = glyphOnly ? color : cutColor;

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {!glyphOnly && <Rect x={2} y={2} width={28} height={28} rx={7} fill={chipFill} />}
      {/* rail (shifted +2 for optical centering) */}
      <Rect x={5.5} y={10} width={21} height={2.5} rx={1} fill={markFill} />
      {/* tooth 1 — short */}
      <Rect x={8.1} y={12.5} width={1.8} height={8} rx={0.9} fill={markFill} />
      {/* tooth 2 — medium */}
      <Rect x={11.6} y={12.5} width={1.8} height={11} rx={0.9} fill={markFill} />
      {/* tooth 3 — tallest (T stem) */}
      <Rect x={15.1} y={12.5} width={1.8} height={14} rx={0.9} fill={markFill} />
      {/* tooth 4 — medium */}
      <Rect x={18.6} y={12.5} width={1.8} height={11} rx={0.9} fill={markFill} />
      {/* tooth 5 — short */}
      <Rect x={22.1} y={12.5} width={1.8} height={8} rx={0.9} fill={markFill} />
    </Svg>
  );
}
