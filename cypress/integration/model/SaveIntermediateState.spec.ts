import { exampleSchemaToJSON, exampleSchema } from "../../utils/exampleTables";
import SaveSchemaState from "../../../frontend/src/model/schema/methodObjects/SaveSchemaState";

describe("SaveIntermediateState", () => {
  it("parses an JSON Schema", () => {
    expect(
      exampleSchema() ==
        new SaveSchemaState().parseSchema(JSON.parse(exampleSchemaToJSON()))
    );
  });
});
