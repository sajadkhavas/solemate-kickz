/**
 * F10 deliberately retires the legacy custom cursor.
 *
 * It hid the native cursor and owned a continuous RAF even when no pointer
 * input was changing. Neither behavior improves product understanding or the
 * purchasing flow, so SOLE now keeps the platform cursor on every device.
 */
export function MagneticCursor() {
  return null;
}
