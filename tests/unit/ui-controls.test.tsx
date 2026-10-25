import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

describe("shared presentation controls", () => {
  it("keeps native semantics and forwards state and events", () => {
    const onChange = vi.fn();
    render(
      <>
        <Button variant="primary" disabled>Start</Button>
        <Input aria-label="Source file" type="file" disabled />
        <Textarea aria-label="Transcript text" defaultValue="draft" onChange={onChange} />
        <Select aria-label="Model" defaultValue="turbo" onChange={onChange}>
          <option value="turbo">Turbo</option>
          <option value="large-v3">large-v3</option>
        </Select>
      </>,
    );

    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
    expect(screen.getByLabelText("Source file")).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Transcript text" })).toHaveValue("draft");
    fireEvent.change(screen.getByRole("textbox", { name: "Transcript text" }), { target: { value: "updated" } });
    expect(screen.getByRole("combobox", { name: "Model" })).toHaveValue("turbo");
    fireEvent.change(screen.getByRole("combobox", { name: "Model" }), { target: { value: "large-v3" } });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("combobox", { name: "Model" })).toHaveValue("large-v3");
  });
});
