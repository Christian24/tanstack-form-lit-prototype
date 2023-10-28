import {html, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';

import {styles} from './styles.js';
import {FinalFormController} from './final-form-controller.js';

import '@material/web/textfield/filled-text-field.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/progress/circular-progress.js';
import {FormOptions} from "@tanstack/form-core";


interface Employee {
    firstName: string;
    lastName: string;
    color: '#FF0000' | '#00FF00' | '#0000FF';
    employed: boolean;
}

// https://final-form.org/docs/final-form/types/Config
const formConfig: FormOptions<Employee, any> = {
    onSubmit: async (values) => {
        await new Promise((r) => setTimeout(r, 500));
        window.alert(JSON.stringify(values, null, 2));
    },


};

@customElement('final-form-demo')
export class FinalFormDemo extends LitElement {
    static styles = styles;

    #controller = new FinalFormController(this, formConfig);

    render() {
        const {form, register, array, getValue, update} = this.#controller;


        return html`
            <form
                    id="form"
                    @submit=${(e: Event) => {
                        e.preventDefault();
                    
                    }}
            >
                <h1>🏁 Tanstack Form - Lit Demo</h1>
                
                <p>
                    Uses record level validation. Errors don't show up until a field is
                    "touched" or a submit is attempted. Errors disappear immediately as
                    the user types.
                </p>
               <div>
                                    <label>First Name</label>
                                    <md-filled-text-field
                                            type="text"
                                            placeholder="First Name"
                                            ${register('firstName', {onChange: (name: string) => name.length < 3 ? 'Not long enough' : undefined})}

                                    ></md-filled-text-field>
                                </div>
                                <div>
                                    <label>Last Name</label>
                                    <md-filled-text-field
                                            type="text"
                                            placeholder="Last Name"
                                            ${register('lastName')}
                                          
                                    ></md-filled-text-field>
                                </div>
                                <div>
                                    <label>Favorite Color</label>
                                    <md-filled-select
                                            ${register('color')}
                                         
                                    >
                                        <md-select-option value="#FF0000">
                                            <div slot="headline">Red</div>
                                        </md-select-option>
                                        <md-select-option value="#00FF00">
                                            <div slot="headline">Green</div>
                                        </md-select-option>
                                        <md-select-option value="#0000FF">
                                            <div slot="headline">Blue</div>
                                        </md-select-option>
                                    </md-filled-select>
                                </div>
                                <div>
                                    <label>Employed?</label>
                                    <md-checkbox ${register('employed')} .type=${'checkbox'}></
                                    <md-checkbox>
                                </div>

                <div>
                    
                </div>
                <div>
                    <md-filled-button type="submit" ?disabled=${form.state.isSubmitting}>${
                            form.state.isSubmitting
                                    ? html`
                                        <md-circular-progress indeterminate
                                                              style="--md-circular-progress-size: 30px;"></md-circular-progress>`
                                    : 'Submit'
                    }
                    </md-filled-button>
                    <md-outlined-button
                            type="button"
                            id="reset"
                            @click=${() => {
                                form.reset();
                            }}
                    >
                        Reset
                    </md-outlined-button>
                </div>
            </form>
            <pre>${JSON.stringify(form.state, null, 2)}</pre>
        `;
    }
}
