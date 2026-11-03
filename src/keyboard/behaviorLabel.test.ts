import { describe, expect, it } from "vitest";
import { behaviorLabel } from "./behaviorLabel";

// The bug this guards: non-HID bindings (&bt, &rgb_ug, &bootloader, &gresc…)
// rendered as blank key caps because only HID usages were ever labelled.

describe("behaviorLabel", () => {
  it("labels Bluetooth select-profile by its number", () => {
    expect(
      behaviorLabel("Bluetooth", [
        { kind: "constant", value: 3, name: "Select Profile" },
        { kind: "range", value: 1, name: "Profile" },
      ])
    ).toEqual({ title: "BT", detail: "1" });
  });

  it("shortens command constants", () => {
    expect(
      behaviorLabel("Underglow", [
        { kind: "constant", value: 5, name: "Previous Effect" },
        { kind: "nil", value: 0 },
      ])
    ).toEqual({ title: "RGB", detail: "FX-" });
  });

  it("labels parameterless behaviors by name", () => {
    expect(behaviorLabel("Bootloader", [])).toEqual({ title: "Boot", detail: "" });
    expect(behaviorLabel("Studio Unlock", [])).toEqual({
      title: "Unlock",
      detail: "",
    });
    expect(behaviorLabel("Grave/Escape", [])).toEqual({
      title: "Esc/`",
      detail: "",
    });
  });

  it("shows the target layer of a momentary layer key", () => {
    expect(
      behaviorLabel("Momentary Layer", [
        { kind: "layer", value: 2, layerName: "Fn" },
        { kind: "nil", value: 0 },
      ])
    ).toEqual({ title: "MO", detail: "Fn" });
  });

  it("falls back to the firmware's wording for unknown behaviors", () => {
    expect(
      behaviorLabel("Mouse Wobble", [
        { kind: "constant", value: 1, name: "Left Wobble" },
      ])
    ).toEqual({ title: "Mouse Wobble", detail: "Left Wobble" });
  });

  it("leaves transparent and none keys blank", () => {
    expect(behaviorLabel("Transparent", [])).toBeUndefined();
    expect(behaviorLabel("None", [])).toBeUndefined();
    expect(behaviorLabel(undefined, [])).toBeUndefined();
  });
});
