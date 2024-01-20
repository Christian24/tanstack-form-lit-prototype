import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { styles } from "./styles.js";
import { TanstackFormController } from "./tanstack-form-controller.js";
import { FieldState, FormOptions } from "@tanstack/form-core";
import { bind } from "./bind.js";
import { repeat } from "lit/directives/repeat.js";

interface Employee {
  firstName: string;
  lastName: string;
  color: "#FF0000" | "#00FF00" | "#0000FF";
  employed: boolean;
  jobTitle: string;
}

interface Data {
  employees: Partial<Employee>[];
}

const formConfig: FormOptions<Data> = {
  onSubmit: async (values) => {
    await new Promise((r) => setTimeout(r, 500));
    window.alert(JSON.stringify(values, null, 2));
  },
};

@customElement("tanstack-form-demo")
export class TanstackFormDemo extends LitElement {
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
        <h1>Tanstack Form - Lit Demo</h1>
        ${this.#form.field(
          {
            name: "employees",
            defaultValue: [],
          },
          (field) => {
            return html`${repeat(
                field.getValue(),
                (_, index) => index,
                (_, index) => {
                  return html`
                    ${this.#form.field(
                      {
                        name: `employees.${index}.firstNames`,
                        validators: {
                          onChange: (state: FieldState<string>) => {
                            return state.value.length < 3
                              ? "Not long enough"
                              : undefined;
                          },
                        },
                      },
                      (field) => {
                        return html` <div>
                          <label>First Name</label>
                          <input
                            type="text"
                            placeholder="First Name"
                            ${bind(field)}
                          />
                        </div>`;
                      },
                    )}
                    ${this.#form.field(
                      { name: `employees.${index}.lastName` },
                      (field) => {
                        return html` <div>
                          <label>Last Name</label>
                          <input
                            type="text"
                            placeholder="Last Name"
                            ${bind(field)}
                          />
                        </div>`;
                      },
                    )}
                    ${this.#form.field(
                      { name: `employees.${index}.color` },
                      (field) => {
                        return html` <div>
                          <label>Favorite Color</label>
                          <select ${bind(field)}>
                            <option value="#FF0000">Red</option>
                            <option value="#00FF00">Green</option>
                            <option value="#0000FF">Blue</option>
                          </select>
                        </div>`;
                      },
                    )}
                    ${this.#form.field(
                      { name: `employees.${index}.employed` },
                      (field) => {
                        return html`<div>
                            <label>Employed?</label>
                            <input
                              type="checkbox"
                              @input="${() =>
                                field.handleChange(!field.getValue())}"
                              .checked="${field.getValue()}"
                              @blur="${() => field.handleBlur()}"
                            />
                          </div>
                          ${field.getValue()
                            ? this.#form.field(
                                {
                                  name: `employees.${index}.jobTitle`,
                                  validators: {
                                    onChange: (state: FieldState<string>) => {
                                      return state.value.length === 0
                                        ? "Needs to have a job here"
                                        : null;
                                    },
                                  },
                                },
                                (field) => {
                                  return html` <div>
                                    <label>Job Title</label>
                                    <input
                                      type="text"
                                      placeholder="Job Title"
                                      ${bind(field)}
                                    />
                                  </div>`;
                                },
                              )
                            : ""} `;
                      },
                    )}
                  `;
                },
              )}

              <div>
                <button
                  type="button"
                  @click=${() => {
                    field.pushValue({
                      firstName: "",
                      lastName: "",
                      employed: false,
                    });
                  }}
                >
                  Add employee
                </button>
              </div> `;
          },
        )}

        <div>
          <button type="submit" ?disabled=${this.#form.api.state.isSubmitting}>
            ${this.#form.api.state.isSubmitting ? html` Submitting` : "Submit"}
          </button>
          <button
            type="button"
            id="reset"
            @click=${() => {
              this.#form.api.reset();
            }}
          >
            Reset
          </button>
        </div>
      </form>
      <pre>${JSON.stringify(this.#form.state, null, 2)}</pre>
    `;
  }
}
