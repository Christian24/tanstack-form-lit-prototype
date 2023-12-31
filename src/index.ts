import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { styles } from "./styles.js";
import { TanstackFormController } from "./tanstack-form-controller.ts";

import "@material/web/textfield/filled-text-field.js";
import "@material/web/checkbox/checkbox.js";
import "@material/web/select/filled-select.js";
import "@material/web/select/select-option.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/progress/circular-progress.js";
import { FormOptions } from "@tanstack/form-core";
import { bind } from "./bind.ts";

interface Employee {
  firstName: string;
  lastName: string;
  color: "#FF0000" | "#00FF00" | "#0000FF";
  employed: boolean;
}

const formConfig: FormOptions<Employee, any> = {
  onSubmit: async (values) => {
    await new Promise((r) => setTimeout(r, 500));
    window.alert(JSON.stringify(values, null, 2));
  },
};

@customElement("final-form-demo")
export class FinalFormDemo extends LitElement {
  static styles = styles;

  #form = new TanstackFormController(this, formConfig);

  render() {
    return html`
      <form
        id="form"
        @submit=${(e: Event) => {
          e.preventDefault();
        }}
      >
        <h1>🏁 Tanstack Form - Lit Demo</h1>

        ${this.#form.field(
          {
            name: "firstName",
            onChange: (name: string) =>
              name.length < 3 ? "Not long enough" : undefined,
          },
          (field) => {
            return html` <div>
              <label>First Name</label>
              <md-filled-text-field
                type="text"
                placeholder="First Name"
                ${bind(field)}
              ></md-filled-text-field>
            </div>`;
          },
        )}
        ${this.#form.field({ name: "lastName" }, (field) => {
          return html` <div>
            <label>Last Name</label>
            <md-filled-text-field
              type="text"
              placeholder="Last Name"
              ${bind(field)}
            ></md-filled-text-field>
          </div>`;
        })}
        ${this.#form.field({ name: "color" }, (field) => {
          return html` <div>
            <label>Favorite Color</label>
            <md-filled-select ${bind(field)}>
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
          </div>`;
        })}
        ${this.#form.field({ name: "employed" }, (field) => {
          return html`<div>
            <label>Employed?</label>
            <md-checkbox
              @input="${() => field.handleChange(!field.getValue())}"
              .checked="${field.getValue()}"
              @blur="${() => field.handleBlur()}"
              .type=${"checkbox"}
            ></md-checkbox>
          </div>`;
        })}

        <div>
          <md-filled-button
            type="submit"
            ?disabled=${this.#form.api.state.isSubmitting}
            >${this.#form.api.state.isSubmitting
              ? html` <md-circular-progress
                  indeterminate
                  style="--md-circular-progress-size: 30px;"
                ></md-circular-progress>`
              : "Submit"}
          </md-filled-button>
          <md-outlined-button
            type="button"
            id="reset"
            @click=${() => {
              this.#form.api.reset();
            }}
          >
            Reset
          </md-outlined-button>
        </div>
      </form>
      <pre>${JSON.stringify(this.#form.api.state, null, 2)}</pre>
    `;
  }
}
