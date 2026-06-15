import { describe, expect, it } from "vitest";
import {
  findBoldRanges,
  hiddenSyntaxDeletion,
  isHiddenBoldMarker,
  parseCheckboxSyntax,
} from "./editorSyntax";

describe("editor syntax", () => {
  describe("checkbox syntax", () => {
    it("detects unchecked checkboxes", () => {
      expect(parseCheckboxSyntax("[ ] task")).toEqual({
        indent: "",
        checked: false,
        from: 0,
        to: 3,
        contentFrom: 3,
      });
    });

    it("detects checked checkboxes with indentation", () => {
      expect(parseCheckboxSyntax("\t[x] task")).toEqual({
        indent: "\t",
        checked: true,
        from: 1,
        to: 4,
        contentFrom: 4,
      });
    });

    it("ignores non-checkbox text", () => {
      expect(parseCheckboxSyntax("not [ ] a checkbox")).toBeNull();
    });
  });

  describe("bold syntax", () => {
    it("treats a single leading marker as line bold", () => {
      expect(findBoldRanges("*important")).toEqual([
        {
          markerFrom: 0,
          textFrom: 1,
          textTo: 10,
          lineBold: true,
        },
      ]);
    });

    it("treats a wrapped pair as inline bold", () => {
      expect(findBoldRanges("*hoje* a noite")).toEqual([
        {
          markerFrom: 0,
          markerTo: 5,
          textFrom: 1,
          textTo: 5,
          lineBold: false,
        },
      ]);
    });

    it("supports line bold after checkbox syntax", () => {
      expect(findBoldRanges("[ ] *task", 3)).toEqual([
        {
          markerFrom: 4,
          textFrom: 5,
          textTo: 9,
          lineBold: true,
        },
      ]);
    });

    it("identifies hidden bold markers only", () => {
      expect(isHiddenBoldMarker("*hoje* a noite", 0)).toBe(true);
      expect(isHiddenBoldMarker("*hoje* a noite", 5)).toBe(true);
      expect(isHiddenBoldMarker("*hoje* a noite", 2)).toBe(false);
      expect(isHiddenBoldMarker("plain *", 6)).toBe(false);
    });
  });

  describe("hidden syntax deletion", () => {
    it("deletes the previous inline bold marker", () => {
      expect(hiddenSyntaxDeletion("*hoje* a noite", 6)).toEqual({
        type: "bold",
        from: 5,
        to: 6,
      });
    });

    it("deletes the next inline bold marker when cursor is before it", () => {
      expect(hiddenSyntaxDeletion("*hoje* a noite", 5)).toEqual({
        type: "bold",
        from: 5,
        to: 6,
      });
    });

    it("deletes a leading line-bold marker", () => {
      expect(hiddenSyntaxDeletion("*important", 1)).toEqual({
        type: "bold",
        from: 0,
        to: 1,
      });
    });

    it("deletes only the closing bracket of a checkbox", () => {
      expect(hiddenSyntaxDeletion("[ ] task", 3)).toEqual({
        type: "checkbox",
        from: 2,
        to: 3,
      });
    });

    it("does not delete visible text as hidden syntax", () => {
      expect(hiddenSyntaxDeletion("plain text", 5)).toBeNull();
    });
  });
});
