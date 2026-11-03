import {
  PhysicalLayout,
  Keymap as KeymapMsg,
  BehaviorBinding,
} from "@zmkfirmware/zmk-studio-ts-client/keymap";
import {
  GetBehaviorDetailsResponse,
  BehaviorParameterValueDescription,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";

import { PhysicalLayout as PhysicalLayoutComp } from "./PhysicalLayout";
import { HidUsageLabel } from "./HidUsageLabel";
import { behaviorLabel, type BindingLabel, type LabelParam } from "./behaviorLabel";
import { matchDescriptor, validateValue } from "../behaviors/parameters";

export type BehaviorMap = Record<number, GetBehaviorDetailsResponse>;

export interface KeymapProps {
  layout: PhysicalLayout;
  keymap: KeymapMsg;
  behaviors: BehaviorMap;
  layers: { id: number; name: string }[];
  selectedLayerIndex: number;
  selectedKeyPosition: number | undefined;
  onKeyPositionClicked: (keyPosition: number) => void;
}

// A layer param renders as the target layer's name rather than as a (meaningless)
// HID usage — this is what makes a layer-tap show the layer it goes to, next to
// its tap key, the way a mod-tap shows its modifier glyph.
const LayerLabel = ({ name }: { name: string }) => (
  <span className="text-xs leading-none text-nowrap" aria-label={name}>
    {name}
  </span>
);

// The kind of a concrete param value, as the label builder needs it.
function toLabelParam(
  value: number,
  descriptor: BehaviorParameterValueDescription | undefined,
  layers: { id: number; name: string }[]
): LabelParam {
  if (!descriptor) {
    return { kind: value === 0 ? "nil" : "unknown", value };
  }
  if (descriptor.nil) return { kind: "nil", value };
  if (descriptor.hidUsage) return { kind: "hid", value };
  if (descriptor.layerId) {
    return {
      kind: "layer",
      value,
      layerName: layers.find((l) => l.id === value)?.name,
    };
  }
  if (descriptor.range) return { kind: "range", value, name: descriptor.name };
  return { kind: "constant", value, name: descriptor.name };
}

// Two-line label for a non-HID binding: the behavior ("BT", "Boot") and, under
// it, what it does ("1", "FX-", a layer name).
const BehaviorKeyLabel = ({ label }: { label: BindingLabel }) => (
  <span
    className="flex flex-col items-center leading-tight text-center"
    aria-label={label.detail ? `${label.title} ${label.detail}` : label.title}
  >
    <span className="text-sm text-nowrap">{label.title}</span>
    {label.detail && (
      <span className="text-xs text-nowrap opacity-75">{label.detail}</span>
    )}
  </span>
);

// Render a binding's editable params, most-significant first (e.g. the tap key
// before the hold of a mod-tap, or before the target layer of a layer-tap). A
// param the behavior describes as a layer is shown by name; everything else
// goes through the HID usage label. Falls back to the HID label for every
// non-zero param when the behavior's metadata isn't loaded yet.
function renderBindingParams(
  binding: BehaviorBinding,
  behavior: GetBehaviorDetailsResponse | undefined,
  layers: { id: number; name: string }[]
) {
  const layerIds = layers.map((l) => l.id);
  const md = behavior?.metadata ?? [];

  // The set whose param1 the current value satisfies (mirrors the picker), so a
  // multi-set behavior is classified against the set actually in effect.
  const set =
    md.find((s) => validateValue(layerIds, binding.param1, s.param1)) ??
    (md.length === 1 ? md[0] : undefined);

  const params = [
    { value: binding.param2, descriptors: set?.param2 },
    { value: binding.param1, descriptors: set?.param1 },
  ].map((p) => ({
    ...p,
    descriptor: matchDescriptor(layerIds, p.value, p.descriptors),
  }));

  // Bindings that send no HID usage (Bluetooth, RGB, bootloader, Studio unlock,
  // momentary layer…) would otherwise render blank or as a bare number: label
  // them from the behavior's own name and its param names instead. Only once
  // the metadata is loaded — before that, fall through to the HID rendering.
  if (behavior && !params.some((p) => p.descriptor?.hidUsage)) {
    const label = behaviorLabel(
      behavior.displayName,
      [...params]
        .reverse()
        .map((p) => toLabelParam(p.value, p.descriptor, layers))
    );
    return label ? [<BehaviorKeyLabel key="behavior" label={label} />] : [];
  }

  return params
    // Drop unused params (the empty hold of a plain key press), but keep a
    // layer param even when it points at layer 0 — that's a real target.
    .filter((p) => p.value !== 0 || !!p.descriptor?.layerId)
    .map((p, index) => {
      if (p.descriptor?.layerId) {
        const layer = layers.find((l) => l.id === p.value);
        return <LayerLabel key={index} name={layer?.name ?? `${p.value}`} />;
      }
      return <HidUsageLabel key={index} hid_usage={p.value} />;
    });
}

export const Keymap = ({
  layout,
  keymap,
  behaviors,
  layers,
  selectedLayerIndex,
  selectedKeyPosition,
  onKeyPositionClicked,
}: KeymapProps) => {
  if (!keymap.layers[selectedLayerIndex]) {
    return <></>;
  }

  const positions = layout.keys.map((k, i) => {
    if (i >= keymap.layers[selectedLayerIndex].bindings.length) {
      return {
        id: `${keymap.layers[selectedLayerIndex].id}-${i}`,
        x: k.x / 100.0,
        y: k.y / 100.0,
        width: k.width / 100,
        height: k.height / 100.0,
        children: <span></span>,
      };
    }

    const binding = keymap.layers[selectedLayerIndex].bindings[i];

    return {
      id: `${keymap.layers[selectedLayerIndex].id}-${i}`,
      x: k.x / 100.0,
      y: k.y / 100.0,
      width: k.width / 100,
      height: k.height / 100.0,
      r: (k.r || 0) / 100.0,
      rx: (k.rx || 0) / 100.0,
      ry: (k.ry || 0) / 100.0,
      children: renderBindingParams(binding, behaviors[binding.behaviorId], layers),
    };
  });

  return (
    <PhysicalLayoutComp
      positions={positions}
      oneU={48}
      zoom="auto"
      selectedPosition={selectedKeyPosition}
      onPositionClicked={onKeyPositionClicked}
    />
  );
};
