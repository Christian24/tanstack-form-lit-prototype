import { FormOptions } from "@tanstack/form-core";
import { html, LitElement } from "lit";
import { TanstackFormController } from "../src/tanstack-form-controller";
import { bind } from "../src/bind";
import { customElement } from "lit/decorators.js";
import "@material/web/textfield/filled-text-field.js";
import "@material/web/checkbox/checkbox.js";
import "@material/web/select/filled-select.js";
import "@material/web/select/select-option.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/progress/circular-progress.js";

interface Employee {
  firstName: string;
  lastName: string;
  color: "#FF0000" | "#00FF00" | "#0000FF";
  employed: boolean;
  jobTitle: string;
}

const formConfig: FormOptions<Partial<Employee>, any> = {
  onSubmit: async (values) => {
    await new Promise((r) => setTimeout(r, 500));
    window.alert(JSON.stringify(values, null, 2));
  },
};

@customElement("test-form")
export class TestForm extends LitElement {
  #form = new TanstackFormController(this, formConfig);

  render() {
    return html`
      <form
        id="form"
        @submit=${(e: Event) => {
          e.preventDefault();
        }}
      >
        <h1>Tanstack Form - Lit Demo</h1>

        ${this.#form.field(
          {
            name: `firstName`,
            validators: {
              onChange: (name: string) =>
                name.length < 3 ? "Not long enough" : undefined,
            },
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
        ${this.#form.field({ name: `lastName` }, (field) => {
          return html` <div>
            <label>Last Name</label>
            <md-filled-text-field
              type="text"
              placeholder="Last Name"
              ${bind(field)}
            ></md-filled-text-field>
          </div>`;
        })}
        ${this.#form.field({ name: `color` }, (field) => {
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
        ${this.#form.field({ name: `employed` }, (field) => {
          return html`
            <div>
              <label>Employed?</label>
              <md-checkbox
                @input="${() => field.handleChange(!field.getValue())}"
                .checked="${field.getValue()}"
                @blur="${() => field.handleBlur()}"
                .type=${"checkbox"}
              ></md-checkbox>
            </div>
            ${field.getValue()
              ? this.#form.field(
                  {
                    name: `jobTitle`,
                    validators: {
                      onChange: (val: string) =>
                        val.length === 0 ? "Needs to have a job here" : null,
                    },
                  },
                  (field) => {
                    return html` <div>
                      <label>Job Title</label>
                      <md-filled-text-field
                        type="text"
                        placeholder="Job Title"
                        ${bind(field)}
                      ></md-filled-text-field>
                    </div>`;
                  },
                )
              : ""}
          `;
        })}
      </form>
  
        

        <div>
          <md-filled-button
            type="submit"
            ?disabled=${this.#form.api.state.isSubmitting}
            >${
              this.#form.api.state.isSubmitting
                ? html` <md-circular-progress
                    indeterminate
                    style="--md-circular-progress-size: 30px;"
                  ></md-circular-progress>`
                : "Submit"
            }
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
      <pre>${JSON.stringify(this.#form.state, null, 2)}</pre>
    `;
  }
}
