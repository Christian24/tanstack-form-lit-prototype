import {
    MdCheckbox,
    MdFilledSelect,
    MdFilledTextField,
    MdOutlinedSelect,
    MdOutlinedTextField
} from "@material/web/all";

export interface ControlValueAccessor<T extends HTMLElement, Value> {

    /**
     * Is this the right ControlValueAccessor for this element type?
     * @param element
     */
    conforms(element: HTMLElement): boolean;
    getValue(element: T): Value;
    setValue(element: T, value: Value): void;
    setCustomValidity(element: T, message: string): void;
    eventName: string;
}

const checkboxValueAccessor: ControlValueAccessor<MdCheckbox, boolean> = {
    conforms(element: HTMLElement): boolean {
        return element.tagName.toLowerCase() === 'md-checkbox';
    },
    setValue(element: MdCheckbox, value: boolean) {
        element.checked = value;
    },
    getValue(element: MdCheckbox): boolean {
        return element.checked;
    },
    setCustomValidity(element: MdCheckbox, message: string) {
        element.setCustomValidity(message);

    },
    eventName:  'input'
}

const textFieldValueAccessor: ControlValueAccessor<MdFilledTextField | MdOutlinedTextField, string> = {
    conforms(element: HTMLElement): boolean {
        return element.tagName.toLowerCase().includes('text-field') &&  element.tagName.toLowerCase().includes('md');
    },
    getValue(element: MdFilledTextField | MdOutlinedTextField): string {
        return element.value;
    },
    setValue(element: MdFilledTextField | MdOutlinedTextField, value: string) {
        element.value = value;
    },
    setCustomValidity(element: MdFilledTextField | MdOutlinedTextField, message: string) {

        element.errorText = message;
        element.error = message.length > 0;
    },
    eventName:  'input'
}
const selectValueAccessor: ControlValueAccessor<MdFilledSelect | MdOutlinedSelect, string> = {
    conforms(element: HTMLElement): boolean {
        return element.tagName.toLowerCase().includes('select') &&  element.tagName.toLowerCase().includes('md');
    },
    setValue(element: MdFilledSelect | MdOutlinedSelect, value: string) {
        if (value === '') {
           element.reset();
        }
        element.value = value;
    },
    getValue(element: MdFilledSelect | MdOutlinedSelect): string {
        console.log(element.value)
        return element.value;
    },
    setCustomValidity(element: MdFilledSelect | MdOutlinedSelect, message: string) {
        element.errorText = message;
        element.error = message.length > 0;
    },
    eventName:  'input'
}

export function getMWCAccessor<T extends HTMLElement, Value = any>(element: T): ControlValueAccessor<T, Value> {
    if (selectValueAccessor.conforms(element)) {
        return selectValueAccessor as any;
    } else if(checkboxValueAccessor.conforms(element)) {
        return checkboxValueAccessor as any;
    }

    return textFieldValueAccessor as any;
}