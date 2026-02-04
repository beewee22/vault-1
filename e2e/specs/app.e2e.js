import { expect } from "@wdio/globals";

describe("Vault-1 desktop smoke", () => {
  it("shows login screen", async () => {
    const heading = await $("h1");
    await expect(heading).toHaveText("Unlock Your Vault");
  });
});
