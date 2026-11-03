// Key-cap labels for bindings that don't send a HID usage (Bluetooth, RGB,
// bootloader, reset, Studio unlock, …). The firmware describes every behavior
// with a display name and names each constant param value ("Select Profile",
// "Previous Effect"), so the label is built from that metadata. The tables
// below only shorten well-known names to fit a 1u key; anything not listed
// falls back to the firmware's own wording, so new behaviors still get a label.

// Keyed by the behavior's display name as reported by the firmware.
const BEHAVIOR_SHORT: Record<string, string> = {
  Bluetooth: "BT",
  Underglow: "RGB",
  Backlight: "BL",
  "Output Selection": "Out",
  "External Power": "Ext Pwr",
  "Grave/Escape": "Esc/`",
  Bootloader: "Boot",
  Reset: "Reset",
  "Studio Unlock": "Unlock",
  "Soft Off": "Off",
  "Caps Word": "Caps Word",
  "Key Repeat": "Repeat",
  "Momentary Layer": "MO",
  "To Layer": "TO",
  "Toggle Layer": "TG",
  "Sticky Layer": "SL",
};

// Keyed by a constant param's name. An empty string drops the name and leaves
// only the accompanying value (e.g. "Select Profile" + 1 reads as "BT 1").
const PARAM_SHORT: Record<string, string> = {
  "Select Profile": "",
  "Next Profile": "Next",
  "Previous Profile": "Prev",
  "Clear Selected Profile": "Clear",
  "Clear All Profiles": "Clear All",
  "Disconnect Profile": "Disc",
  "Toggle On/Off": "Toggle",
  "Turn On": "On",
  "Turn OFF": "Off",
  "Set Color": "Color",
  "Next Effect": "FX+",
  "Previous Effect": "FX-",
  "Brightness Up": "Bri+",
  "Brightness Down": "Bri-",
  "Hue Up": "Hue+",
  "Hue Down": "Hue-",
  "Saturation Up": "Sat+",
  "Saturation Down": "Sat-",
  "Speed Up": "Spd+",
  "Speed Down": "Spd-",
  "Toggle Outputs": "Toggle",
  "USB Output": "USB",
  "BLE Output": "BLE",
  "No Output": "None",
};

// Behaviors that do nothing visible on their own; their keys stay blank.
const UNLABELLED = new Set(["Transparent", "None"]);

export interface LabelParam {
  // The value's kind, from the behavior's param metadata.
  kind: "constant" | "range" | "layer" | "hid" | "nil" | "unknown";
  value: number;
  // The constant's or range's name from the metadata, if any.
  name?: string;
  // For layer params: the target layer's name.
  layerName?: string;
}

export interface BindingLabel {
  // Main line, e.g. "BT", "Boot", "MO".
  title: string;
  // Second line, e.g. "1", "FX-", "Fn"; empty when there's nothing to add.
  detail: string;
}

export function shortBehaviorName(displayName: string): string {
  return BEHAVIOR_SHORT[displayName] ?? displayName;
}

function shortParamName(name: string): string {
  return PARAM_SHORT[name] ?? name;
}

/**
 * The label for a binding whose params contain no HID usage, or undefined when
 * the key should stay blank. Params are given in binding order (param1, then
 * param2), so a command constant comes before its argument: "BT" + "Next", or
 * "BT" + "1" for Select Profile 1.
 */
export function behaviorLabel(
  displayName: string | undefined,
  params: LabelParam[]
): BindingLabel | undefined {
  if (!displayName || UNLABELLED.has(displayName)) {
    return undefined;
  }

  const detail = params
    .filter((p) => p.kind !== "nil" && p.kind !== "hid")
    .map((p) => {
      switch (p.kind) {
        case "constant":
          return p.name ? shortParamName(p.name) : `${p.value}`;
        case "layer":
          return p.layerName ?? `${p.value}`;
        default:
          return `${p.value}`;
      }
    })
    .filter((s) => s !== "")
    .join(" ");

  return { title: shortBehaviorName(displayName), detail };
}
