import {html, noChange, nothing, ReactiveController, ReactiveControllerHost, TemplateResult,} from 'lit';
import {Directive, directive, ElementPart, PartInfo, PartType,} from 'lit/directive.js';
import {DeepKeys, DeepValue, FieldApi, FieldApiOptions, FieldOptions, FormApi, FormOptions} from '@tanstack/form-core'
import {ControlValueAccessor, getMWCAccessor} from "./control-value-accessor.ts";


type ArrayRenderItemCallback<T> = (item: T, register: (name: string) => TemplateResult, index: number) => TemplateResult;


export class TanstackFormController<FormValues, Validator> implements ReactiveController {
    
    #host: ReactiveControllerHost;
    #subscription?: () => void;

    form: FormApi<FormValues, Validator>;


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


    register = <K extends DeepKeys<FormValues>>(
        name: K,
        fieldConfig?: Omit<FieldApiOptions<FormValues, K, any, Validator>, 'name' | 'form'>
    ) => {
        return registerDirective(this.form as any,getMWCAccessor, String(name), fieldConfig as any);
    };

    array = <K extends keyof FormValues>(name: K, cb: ArrayRenderItemCallback<unknown>, fieldConfig?: Omit<FieldApiOptions<FormValues, K, any, Validator>, 'name' | 'form'>) => {
        return renderArrayDirective(this.form as any, String(name), cb, fieldConfig as any)
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
                const options = {...fieldConfig, name, form};

                this.#field = new FieldApi(options);
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
                const fieldMeta = form.getFieldMeta(name);  // this.#field?.state.meta.touchedErrors doesn't seem to have the same info


                if (value !== fieldValue) {
                    if (!fieldValue) {
                        this.#accessor.setValue(el, this.#initialValue );
                    } else {
                        this.#accessor.setValue(el, fieldValue);
                    }
                }

                // TODO Move this logic into the accessor
                if (fieldMeta?.touchedErrors) {

                    if (fieldMeta.touchedErrors.length > 0) {
                        this.#accessor.setCustomValidity(el, String(fieldMeta.touchedErrors[0]))
                    } else {
                        this.#accessor.setCustomValidity(el,'');
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
        _fieldConfig?: Omit<FieldApiOptions<FormValues, DeepKeys<FormValues>, any, Validator>, 'name' | 'form'>
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
        _fieldConfig?: Omit<FieldOptions<FormValues, DeepKeys<FormValues>, any, Validator>, 'name'>
    ) {

        return html`${this.#value.map((item: T, index: number) => {
            const arrayName = `${String(_name)}[${index}]`;
            const register = (elementName: string) => {
                const name = `${arrayName}.${elementName}`;
                return registerDirective(_form, name, _fieldConfig);
            }
           
           
            return cb(item, register as any, index);
        })}`;
    }
}

const renderArrayDirective = directive(RenderArrayDirective);