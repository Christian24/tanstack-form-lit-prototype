import { ElementPart, PartInfo, PartType, directive } from "lit/directive.js";
import { FieldApi } from "@tanstack/form-core";
import {
  ControlValueAccessor,
  getMWCAccessor,
} from "./control-value-accessor.ts";
import { noChange, nothing } from "lit";
import { AsyncDirective } from "lit/async-directive.js";
class BindDirective extends AsyncDirective {
  #registered = false;

  #initialValue?: any;
  #accessor?: ControlValueAccessor<HTMLElement, any>;
  #subscription?: () => void;
  #element?: HTMLElement;
  #blurFn?: () => void;
  #changeFn?: () => void;
  #field?: FieldApi<any, any, any, any>;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error(
        "The `bind` directive must be used in the `element` attribute",
      );
    }
  }

  update(
    part: ElementPart,
    [fieldConfig, accessorFn]: Parameters<this["render"]>,
  ) {
    this.#element = part.element as HTMLElement;
    this.#field = fieldConfig;
    if (!this.#registered) {
      if (accessorFn === undefined) {
        accessorFn = getMWCAccessor;
      }
      this.#accessor = accessorFn(this.#element);

      // Otherwise we would assign undefined on reset which is not permitted for the control
      // Should this live in @tanstack/forms?
      this.#initialValue = this.#accessor.getValue(this.#element);

      this.#registered = true;
      this.subscribe(fieldConfig, this.#element);
    }
    return noChange;
  }

  protected disconnected() {
    super.disconnected();
    this.#subscription?.();
    if (this.#element) {
      if (this.#blurFn) {
        this.#element.removeEventListener("blur", this.#blurFn);
      }
      if (this.#changeFn && this.#accessor) {
        this.#element.removeEventListener(
          this.#accessor.eventName,
          this.#changeFn,
        );
      }
    }
    console.log("Disconnected");
  }

  // Can't get generics carried over from directive call
  render(field: FieldApi<any, any, any, any>, accessorFn = getMWCAccessor) {
    return nothing;
  }

  protected subscribe(field: FieldApi<any, any, any, any>, el: HTMLElement) {
    if (this.#accessor == undefined) {
      return;
    }

    this.#subscription = field.store.subscribe(() => {
      if (this.#accessor == undefined) {
        return;
      }

      const value = this.#accessor.getValue(el);
      const fieldValue = field.state.value as any;
      const fieldMeta = field.getMeta();

      if (value !== fieldValue) {
        if (!fieldValue) {
          this.#accessor.setValue(el, this.#initialValue);
        } else {
          this.#accessor.setValue(el, fieldValue);
        }
      }

      this.#accessor.setCustomValidity?.(
        el,
        fieldMeta?.touchedErrors as string[],
      );
    });
    this.#blurFn = () => {
      if (this.#field) {
        this.#field.handleBlur();
      }
    };
    this.#changeFn = () => {
      if (this.#accessor === undefined) {
        return;
      }
      if (this.#element && this.#field) {
        const value = this.#accessor.getValue(this.#element);
        field.handleChange(value as any);
      }
    };

    el.addEventListener("blur", this.#blurFn);
    el.addEventListener(this.#accessor.eventName, this.#changeFn);
  }
}
export const bind = directive(BindDirective);
