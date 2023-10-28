import {html, noChange, nothing, ReactiveController, ReactiveControllerHost, TemplateResult,} from 'lit';
import {Directive, directive, ElementPart, PartInfo, PartType,} from 'lit/directive.js';
import {DeepKeys, DeepValue, FieldApi, FieldOptions, FormApi, FormOptions} from '@tanstack/form-core'
import {
    FieldConfig, FieldState,
} from 'final-form';
import {ControlValueAccessor, getMWCAccessor} from "./control-value-accessor.ts";


type ArrayRenderItemCallback<T> = (item: T, register: (name: string) => TemplateResult, getFieldState: (fieldName: string) => FieldState<any> | undefined, index: number) => TemplateResult;


export class FinalFormController<FormValues, Validator> implements ReactiveController {
    #host: ReactiveControllerHost;
    #subscription?: () => void;

    form: FormApi<FormValues, Validator>;

    // https://final-form.org/docs/final-form/types/Config
    constructor(
        host: ReactiveControllerHost,
        config: FormOptions<FormValues, Validator>
    ) {
        (this.#host = host).addController(this);



        this.form = new FormApi<FormValues, Validator>(config);
    }

    hostConnected() {

       this.#subscription =  this.form.store.subscribe(() => {
            this.#host.requestUpdate();
        });
    }

    hostDisconnected() {
        this.#subscription?.();
    }

    // https://final-form.org/docs/final-form/types/FieldConfig
    register = <K extends DeepKeys<FormValues>>(
        name: K,
        fieldConfig?: FieldConfig<FormValues[K]>
    ) => {
        return registerDirective(this.form as any,getMWCAccessor, String(name), fieldConfig);
    };

    array = <K extends keyof FormValues>(name: K, cb: ArrayRenderItemCallback<unknown>, _fieldConfig?: FieldConfig<any>) => {
        return renderArrayDirective(this.form as any, String(name), cb, _fieldConfig)
    }
    update = <K extends DeepKeys<FormValues>>(name: K, newValue: DeepValue<FormValues, K>) => {
        this.form.setFieldValue(name, newValue);
    }

    getValue = <K extends DeepKeys<FormValues>>(name: K): DeepValue<FormValues, K> => {
        return this.form.getFieldValue(name);
    }


}

class RegisterDirective<FormValues, Validator> extends Directive {
    #registered = false;
    #field?: FieldApi<FormValues, any, Validator, any>
    #initialValue?: any;
    #accessor!: ControlValueAccessor<HTMLElement, any>;

    constructor(partInfo: PartInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.ELEMENT) {
            throw new Error(
                'The `register` directive must be used in the `element` attribute'
            );
        }
    }

    update(
        part: ElementPart,
        [form, accessorFn, name, fieldConfig]: Parameters<this['render']>
    ) {
        if (!this.#registered) {
            if (!this.#field) {
                this.#field = new FieldApi({form, name});
            }
            const el = part.element as HTMLElement;
            this.#accessor = accessorFn(el);
            this.#field.mount();




           // Otherwise we would assign undefined on reset which is not permitted for the control
            // Should this live in @tanstack/forms?
            this.#initialValue = this.#accessor.getValue(el);

            this.#field?.store.subscribe(() => {
                const value = this.#accessor.getValue(el);
                const fieldValue = this.#field?.state.value as any;

                if (value !== fieldValue) {
                    if (!fieldValue) {
                        this.#accessor.setValue(el, this.#initialValue );
                    } else {
                        this.#accessor.setValue(el, fieldValue);
                    }
                }
            });
            (el as HTMLInputElement).name = String(name);
            el.addEventListener('blur', () => this.#field?.handleBlur());
            el.addEventListener(this.#accessor.eventName, () => {
               const value = this.#accessor.getValue(el)
                this.#field?.handleChange(
                       value as any
                    )
                }
            );


            this.#registered = true;
        }

        return noChange;
    }

    // Can't get generics carried over from directive call
    render(
        _form: FormApi<FormValues, Validator>,
        _accessorFn: (element: HTMLElement) => ControlValueAccessor<HTMLElement, any>,
        _name: DeepKeys<FormValues>,
        _fieldConfig?: FieldOptions<any, any, any, any>
    ) {
        return nothing;
    }

}

const registerDirective = directive(RegisterDirective);


class RenderArrayDirective<FormValues, Validator> extends Directive {
    #registered = false;
    #value: any[] = [];

    constructor(partInfo: PartInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.CHILD) {
            throw new Error(
                'The `renderArray` directive must be used in text expressions'
            );
        }
    }

    update(
        part: ElementPart,
        [form, name, cb, fieldConfig]: Parameters<this['render']>
    ) {
        if (!this.#registered) {
            const field = new FieldApi({form, name})
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
        _fieldConfig?: FieldConfig<any>
    ) {

        return html`${this.#value.map((item: T, index: number) => {
            const arrayName = `${String(_name)}[${index}]`;
            const register = (elementName: string) => {
                const name = `${arrayName}.${elementName}`;
                return registerDirective(_form, name, _fieldConfig);
            }
            const getFieldState = (elementName: string) => {
                const name = `${arrayName}.${elementName}`;
                return _form.getFieldState(name);
            }
           
            return cb(item, register as any, getFieldState, index);
        })}`;
    }
}

const renderArrayDirective = directive(RenderArrayDirective);