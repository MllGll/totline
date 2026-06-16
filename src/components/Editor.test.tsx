/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Editor } from "./Editor";

beforeAll(() => {
  const rect = {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
  const rects = {
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* iterator() {},
  } as DOMRectList;

  Range.prototype.getBoundingClientRect = () => rect;
  Range.prototype.getClientRects = () => rects;
});

afterEach(() => {
  cleanup();
});

function renderEditor(overrides: Partial<React.ComponentProps<typeof Editor>> = {}) {
  const props: React.ComponentProps<typeof Editor> = {
    content: "",
    zoom: 1,
    cursor: 0,
    selectionStart: 0,
    selectionEnd: 0,
    scrollTop: 0,
    scrollLeft: 0,
    headerVisible: false,
    onContentChange: vi.fn(),
    onCursorChange: vi.fn(),
    onSelectionChange: vi.fn(),
    onScrollChange: vi.fn(),
    onZoomChange: vi.fn(),
    onZoomActivity: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<Editor {...props} />),
    props,
  };
}

describe("Editor integration", () => {
  it("renders checkbox syntax as an interactive checkbox", async () => {
    const { props } = renderEditor({ content: "[ ] task" });

    const checkbox = await screen.findByRole("button", {
      name: "Mark as complete",
    });

    expect(checkbox).toHaveAttribute("data-checked", "false");

    await userEvent.click(checkbox);

    await waitFor(() => {
      expect(props.onContentChange).toHaveBeenCalledWith("[x] task");
    });
  });

  it("renders checked checkbox text as completed", async () => {
    renderEditor({ content: "[x] done" });

    const checkbox = await screen.findByRole("button", {
      name: "Mark as pending",
    });
    const completedText = document.querySelector(".cm-completed-text");

    expect(checkbox).toHaveAttribute("data-checked", "true");
    expect(completedText).toHaveTextContent("done");
  });

  it("hides bold markers while preserving the visible text", async () => {
    renderEditor({ content: "*hoje* a noite" });

    await waitFor(() => {
      expect(document.querySelector(".cm-bold-text")).toHaveTextContent("hoje");
    });

    const line = document.querySelector(".cm-line");
    expect(line).toHaveTextContent("hoje a noite");
    expect(line).not.toHaveTextContent("*");
  });

  it("removes hidden checkbox syntax with Backspace", async () => {
    const { props } = renderEditor({
      content: "[ ] task",
      cursor: 3,
      selectionStart: 3,
      selectionEnd: 3,
    });

    const editor = document.querySelector(".cm-content") as HTMLElement;
    editor.focus();

    fireEvent.keyDown(editor, { key: "Backspace" });

    await waitFor(() => {
      expect(props.onContentChange).toHaveBeenCalledWith("[  task");
    });
  });

  it("removes hidden bold markers with Backspace", async () => {
    const { props } = renderEditor({
      content: "*hoje* a noite",
      cursor: 6,
      selectionStart: 6,
      selectionEnd: 6,
    });

    const editor = document.querySelector(".cm-content") as HTMLElement;
    editor.focus();

    fireEvent.keyDown(editor, { key: "Backspace" });

    await waitFor(() => {
      expect(props.onContentChange).toHaveBeenCalledWith("*hoje a noite");
    });
  });

  it("applies the refined header offset without changing editor content", () => {
    const { container, rerender, props } = renderEditor({
      content: "plain text",
      headerVisible: false,
    });

    const host = container.firstElementChild as HTMLElement;
    expect(host).toHaveStyle({ transform: "translateY(40px)" });

    rerender(<Editor {...props} headerVisible />);

    expect(host).toHaveStyle({ transform: "translateY(80px)" });
    expect(container.querySelector(".cm-line")).toHaveTextContent("plain text");
  });

  it("uses JetBrains Mono as the editor typeface with a light normal weight", () => {
    renderEditor({ content: "plain text" });

    const scroller = document.querySelector(".cm-scroller") as HTMLElement;
    const editor = document.querySelector(".cm-editor") as HTMLElement;

    expect(window.getComputedStyle(scroller).fontFamily).toContain(
      "JetBrains Mono",
    );
    expect(window.getComputedStyle(editor).fontWeight).toBe("200");
  });

  it("changes zoom with ctrl wheel and reports zoom activity", () => {
    const { container, props } = renderEditor({ zoom: 1 });
    const host = container.querySelector(".cm-editor-mount") as HTMLElement;

    fireEvent.wheel(host, { ctrlKey: true, deltaY: -100 });

    expect(props.onZoomChange).toHaveBeenCalledWith(1.05);
    expect(props.onZoomActivity).toHaveBeenCalled();
  });
});
