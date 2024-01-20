import { FormOptions } from "@tanstack/form-core";
import { html, LitElement } from "lit";
import { TanstackFormController } from "../src/tanstack-form-controller";
import { bind } from "../src/bind";
import { customElement } from "lit/decorators.js";

interface Employee {
  firstName: string;
  lastName: string;
  color: "#FF0000" | "#00FF00" | "#0000FF";
  employed: boolean;
  jobTitle: string;
}

export const sampleData: Partial<Employee> = { firstName: "Christian" };

const formConfig: FormOptions<Partial<Employee>> = {
  onSubmit: async (values) => {
    await new Promise((r) => setTimeout(r, 500));
    window.alert(JSON.stringify(values, null, 2));
  },
  defaultValues: sampleData,
};

@customElement("test-form")
export class TestForm extends LitElement {
  form = new TanstackFormController(this, formConfig);

  render() {
    return html`
      <form
        id="form"
        @submit=${(e: Event) => {
          e.preventDefault();
        }}
      >
        <h1>Tanstack Form - Lit Demo</h1>

        ${this.form.field(
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
              <input
                id="firstName"
                type="text"
                placeholder="First Name"
                ${bind(field)}
              />
            </div>`;
          },
        )}
        ${this.form.field(
          {
            name: `lastName`,
            validators: {
              onChange: (name: string) =>
                name.length < 3 ? "Not long enough" : undefined,
            },
          },
          (field) => {
            return html` <div>
              <label>Last Name</label>
              <input
                id="lastName"
                type="text"
                placeholder="Last Name"
                ${bind(field)}
              />
            </div>`;
          },
        )}
        ${this.form.field({ name: `color` }, (field) => {
          return html` <div>
            <label>Favorite Color</label>
            <select ${bind(field)}>
              <option value="#FF0000">Red</option>
              <option value="#00FF00">Green</option>
              <option value="#0000FF">Blue</option>
            </select>
          </div>`;
        })}
        ${this.form.field({ name: `employed` }, (field) => {
          return html`
            <div>
              <label>Employed?</label>
              <input
                @input="${() => field.handleChange(!field.getValue())}"
                .checked="${field.getValue()}"
                @blur="${() => field.handleBlur()}"
                id="employed"
                .type=${"checkbox"}
              />
            </div>
            ${field.getValue()
              ? this.form.field(
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
                      <input
                        type="text"
                        id="jobTitle"
                        placeholder="Job Title"
                        ${bind(field)}
                      />
                    </div>`;
                  },
                )
              : ""}
          `;
        })}
      </form>
  
        

        <div>
          <button
            type="submit"
            ?disabled=${this.form.api.state.isSubmitting}
            >${this.form.api.state.isSubmitting ? html` Submitting` : "Submit"}
          </button>
          <button
            type="button"
            id="reset"
            @click=${() => {
              this.form.api.reset();
            }}
          >
            Reset
          </button>
        </div>
      </form>
      <pre>${JSON.stringify(this.form.state, null, 2)}</pre>
    `;
  }
}
