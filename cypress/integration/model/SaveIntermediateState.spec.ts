import { exampleSchemaToJSON, exampleSchema } from "../../utils/exampleTables";
import SaveIntermediateState from "../../../frontend/src/model/schema/methodObjects/saveIntermediateState";

describe("SaveIntermediateState", () => {
  it("parses an JSON Schema", () => {
    expect(
      exampleSchema() ==
        new SaveIntermediateState().parseSchema(
          JSON.parse(exampleSchemaToJSON())
        )
    );
  });
});
