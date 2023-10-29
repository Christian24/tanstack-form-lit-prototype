import {
  Directive,
  ElementPart,
  PartInfo,
  PartType,
  directive,
} from "lit/directive.js";
import { FieldApi } from "@tanstack/form-core";
import {
  ControlValueAccessor,
  getMWCAccessor,
} from "./control-value-accessor.ts";
import { noChange, nothing } from "lit";
class BindDirective extends Directive {
  #registered = false;
  #field?: FieldApi<any, any, any, any>;
  #initialValue?: any;
  #accessor!: ControlValueAccessor<HTMLElement, any>;

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
    if (!this.#registered) {
      if (!this.#field) {
        this.#field = fieldConfig;
      }
      const name = fieldConfig.name;
      const el = part.element as HTMLElement;
      if (accessorFn === undefined) {
        accessorFn = getMWCAccessor;
      }
      this.#accessor = accessorFn(el);

      // Otherwise we would assign undefined on reset which is not permitted for the control
      // Should this live in @tanstack/forms?
      this.#initialValue = this.#accessor.getValue(el);

      this.#field?.store.subscribe(() => {
        const value = this.#accessor.getValue(el);
        const fieldValue = this.#field?.state.value as any;
        const fieldMeta = fieldConfig.getMeta();

        if (value !== fieldValue) {
          if (!fieldValue) {
            this.#accessor.setValue(el, this.#initialValue);
          } else {
            this.#accessor.setValue(el, fieldValue);
          }
        }

        // TODO Move this logic into the accessor
        if (fieldMeta?.touchedErrors) {
          if (fieldMeta.touchedErrors.length > 0) {
            this.#accessor.setCustomValidity(
              el,
              String(fieldMeta.touchedErrors[0]),
            );
          } else {
            this.#accessor.setCustomValidity(el, "");
          }
        }
      });
      (el as HTMLInputElement).name = String(name);
      el.addEventListener("blur", () => this.#field?.handleBlur());
      el.addEventListener(this.#accessor.eventName, () => {
        const value = this.#accessor.getValue(el);
        this.#field?.handleChange(value as any);
      });

      this.#registered = true;
    }

    return noChange;
  }

  // Can't get generics carried over from directive call
  render(field: FieldApi<any, any, any, any>, accessorFn = getMWCAccessor) {
    return nothing;
  }
}
export const bind = directive(BindDirective);
