/**
 * True when an outside-dismiss event originated from content rendered in a
 * Radix portal (Select, DropdownMenu, Popover, Tooltip, …). Dialog / Sheet
 * layers must not treat these as "outside" or they can close while the
 * portal unmounts and trigger React DOM errors ("removeChild: The node to be
 * removed is not a child of this node").
 */
export function isRadixPortaledLayerTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("[data-radix-popper-content-wrapper]") ||
      target.closest('[role="listbox"]') ||
      target.closest('[role="menu"]') ||
      target.closest("[data-radix-tooltip-content]") ||
      target.closest("[data-radix-popover-content]")
  );
}
