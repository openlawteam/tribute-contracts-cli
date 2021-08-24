import { DEFAULT_SNAPSHOT_HUB_API_URL } from "../../msw-mocks/helpers";
import { rest, server } from "../../msw-mocks/server";
import {
  submitManagingProposal,
  processManagingProposal,
} from "../../../src/contracts/adapters/managing-adapter";

describe("Managing Adapter", () => {
  it("should submit a proposal", async () => {
    let testError;

    try {
      // Using fake data
      await submitManagingProposal({
        adapterName: "My New Adapter",
        adapterAddress: "0x4339316e04CFfB5961D1c41fEF8E44bfA2A7fBd1",
        aclFlags: ["REPLACE_ADAPTER"],
        opts: {},
      });
    } catch (error) {
      testError = error;
    }

    expect(testError).toBe(undefined);
  });
});
