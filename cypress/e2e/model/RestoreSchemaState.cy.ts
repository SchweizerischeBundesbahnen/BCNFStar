import { exampleSchemaToJSON, exampleSchema } from "../../utils/exampleTables";
import RestoreSchemaState from "../../../frontend/src/model/schema/methodObjects/RestoreSchemaState";

describe("RestoreSchemaState", () => {
  it("parses an JSON Schema", () => {
    expect(
      exampleSchema() ==
        new RestoreSchemaState().parseSchema(JSON.parse(exampleSchemaToJSON()))
    );
  });
});
