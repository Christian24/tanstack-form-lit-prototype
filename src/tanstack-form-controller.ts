import { nothing, ReactiveController, ReactiveControllerHost } from "lit";
import { directive, ElementPart, PartInfo, PartType } from "lit/directive.js";
import {
  DeepKeys,
  FieldApi,
  FieldOptions,
  FormApi,
  FormOptions,
  FormState,
} from "@tanstack/form-core";
import { AsyncDirective } from "lit/async-directive.js";

type renderCallback<
  FormValues,
  Name extends DeepKeys<FormValues>,
  ValidatorType,
  Validator,
> = (
  fieldOptions: FieldApi<FormValues, Name, ValidatorType, Validator>,
) => unknown;
type fieldDirectiveType<
  FormValues,
  Name extends DeepKeys<FormValues>,
  ValidatorType,
  Validator,
> = (
  form: FormApi<FormValues, Validator>,
  options: FieldOptions<FormValues, Name, ValidatorType, Validator>,
  render: renderCallback<FormValues, Name, ValidatorType, Validator>,
) => {
  values: {
    form: FormApi<FormValues, Validator>;
    options: FieldOptions<FormValues, Name, ValidatorType, Validator>;
    render: renderCallback<FormValues, Name, ValidatorType, Validator>;
  };
};

export class TanstackFormController<FormValues, Validator>
  implements ReactiveController
{
  #host: ReactiveControllerHost;
  #subscription?: () => void;

  api: FormApi<FormValues, Validator>;
  state?: FormState<FormValues>;

  constructor(
    host: ReactiveControllerHost,
    config?: FormOptions<FormValues, Validator>,
  ) {
    (this.#host = host).addController(this);

    this.api = new FormApi<FormValues, Validator>(config);
  }

  hostConnected() {
    this.#subscription = this.api.store.subscribe(() => {
      this.#host.requestUpdate();
      this.state = this.api.store.state;
    });
  }

  hostDisconnected() {
    this.#subscription?.();
  }

  field = <K extends DeepKeys<FormValues>, ValidatorType>(
    fieldConfig: FieldOptions<FormValues, K, ValidatorType, Validator>,
    render: renderCallback<FormValues, K, ValidatorType, Validator>,
  ) => {
    return (
      fieldDirective as unknown as fieldDirectiveType<
        FormValues,
        K,
        ValidatorType,
        Validator
      >
    )(this.api, fieldConfig, render);
  };
}

class FieldDirective<
  FormValues,
  Name extends DeepKeys<FormValues>,
  ValidatorType,
  Validator,
> extends AsyncDirective {
  #registered = false;
  #field?: FieldApi<FormValues, Name, ValidatorType, Validator>;
  #unmount?: () => void;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD) {
      throw new Error(
        "The `field` directive must be used in the `child` attribute",
      );
    }
  }

  update(
    _: ElementPart,
    [form, fieldConfig, _render]: Parameters<this["render"]>,
  ) {
    if (!this.#registered) {
      if (!this.#field) {
        const options = { ...fieldConfig, form };

        this.#field = new FieldApi(options);
        this.#unmount = this.#field.mount();
      }

      this.#registered = true;
    }

    return this.render(form, fieldConfig, _render);
  }

  protected disconnected() {
    super.disconnected();
    console.log(this.#field?.options.preserveValue);
    console.log(this.#unmount);
    this.#unmount?.();
  }

  protected reconnected() {
    super.reconnected();
    if (this.#field) {
      this.#unmount = this.#field.mount();
    }
  }

  render(
    _form: FormApi<FormValues, Validator>,
    _fieldConfig: FieldOptions<FormValues, Name, ValidatorType, Validator>,
    _renderCallback: renderCallback<FormValues, Name, ValidatorType, Validator>,
  ) {
    if (this.#field) {
      return _renderCallback(this.#field);
    }
    return nothing;
  }
}

const fieldDirective = directive(FieldDirective);
