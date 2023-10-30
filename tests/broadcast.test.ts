import { broadcast } from "../src/index";

describe("setup raft server", () => {
  it("accepts port and ports argument", () => {});
});

test("Broadcast message", () => {
  broadcast({ type: "APPEND_LOG", data: "TEST MESSAGE" });
});
