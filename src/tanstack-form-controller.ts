import {
  html,
  noChange,
  nothing,
  ReactiveController,
  ReactiveControllerHost,
  TemplateResult,
} from "lit";
import {
  Directive,
  directive,
  ElementPart,
  PartInfo,
  PartType,
} from "lit/directive.js";
import {
  DeepKeys,
  DeepValue,
  FieldApi,
  FieldApiOptions,
  FieldOptions,
  FormApi,
  FormOptions,
} from "@tanstack/form-core";

type ArrayRenderItemCallback<T> = (
  item: T,
  register: (name: string) => TemplateResult,
  index: number,
) => TemplateResult;

export class TanstackFormController<FormValues, Validator>
  implements ReactiveController
{
  #host: ReactiveControllerHost;
  #subscription?: () => void;

  api: FormApi<FormValues, Validator>;

  constructor(
    host: ReactiveControllerHost,
    config: FormOptions<FormValues, Validator>,
  ) {
    (this.#host = host).addController(this);

    this.api = new FormApi<FormValues, Validator>(config);
  }

  hostConnected() {
    this.#subscription = this.api.store.subscribe(() => {
      this.#host.requestUpdate();
    });
  }

  hostDisconnected() {
    this.#subscription?.();
  }

  field = <K extends DeepKeys<FormValues>>(
    fieldConfig: FieldOptions<FormValues, K, any, Validator>,
    render: (field: FieldApi<FormValues, K, any, Validator>) => unknown,
  ) => {
    return fieldDirective(this.api as any, fieldConfig as any, render as any);
  };

  update = <K extends DeepKeys<FormValues>>(
    name: K,
    newValue: DeepValue<FormValues, K>,
  ) => {
    this.api.setFieldValue(name, newValue);
  };

  getValue = <K extends DeepKeys<FormValues>>(
    name: K,
  ): DeepValue<FormValues, K> => {
    return this.api.getFieldValue(name);
  };
}

class FieldDirective<FormValues, Validator> extends Directive {
  #registered = false;
  #field?: FieldApi<FormValues, any, Validator, any>;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD) {
      throw new Error(
        "The `register` directive must be used in the `child` attribute",
      );
    }
  }

  update(
    part: ElementPart,
    [form, fieldConfig, _render]: Parameters<this["render"]>,
  ) {
    if (!this.#registered) {
      if (!this.#field) {
        const options = { ...fieldConfig, form };
        console.log("Create");
        this.#field = new FieldApi(options as any);
        this.#field.mount();
      }

      this.#registered = true;
    }

    return this.render(form, fieldConfig, _render);
  }

  // Can't get generics carried over from directive call
  render<Name extends DeepKeys<FormValues>>(
    _form: FormApi<FormValues, Validator>,
    _fieldConfig: FieldOptions<FormValues, Name, any, Validator>,
    _renderCallback: (
      field: FieldApi<FormValues, Name, any, Validator>,
    ) => unknown,
  ) {
    if (this.#field) {
      return _renderCallback(this.#field);
    }
    return nothing;
  }
}

const fieldDirective = directive(FieldDirective);

class RenderArrayDirective<FormValues, Validator> extends Directive {
  #registered = false;
  #value: any[] = [];

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD) {
      throw new Error(
        "The `renderArray` directive must be used in text expressions",
      );
    }
  }

  update(
    part: ElementPart,
    [form, name, cb, fieldConfig]: Parameters<this["render"]>,
  ) {
    if (!this.#registered) {
      const field = new FieldApi({ form, name });
      field.store.subscribe(() => {
        const value = field.getValue();
        if (value) {
          this.#value = value;
        } else {
          this.#value = [];
        }
      });
    }

    return this.render(form, name, cb, fieldConfig);
  }

  // Can't get generics carried over from directive call
  render<T>(
    _form: FormApi<FormValues, Validator>,
    _name: DeepKeys<FormValues>,
    cb: ArrayRenderItemCallback<T>,
    _fieldConfig?: Omit<
      FieldOptions<FormValues, DeepKeys<FormValues>, any, Validator>,
      "name"
    >,
  ) {
    return html`${this.#value.map((item: T, index: number) => {
      const arrayName = `${String(_name)}[${index}]`;
      const register = (elementName: string) => {
        const name = `${arrayName}.${elementName}`;
        return fieldDirective(_form, name, _fieldConfig);
      };

      return cb(item, register as any, index);
    })}`;
  }
}

const renderArrayDirective = directive(RenderArrayDirective);
