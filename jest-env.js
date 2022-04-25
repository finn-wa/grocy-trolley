const NodeEnvironment = require("jest-environment-node");

class Node18Environment extends NodeEnvironment {
  async setup() {
    await super.setup();
    this.global.fetch = fetch;
    this.global.FormData = FormData;
    this.global.Blob = Blob;
    this.global.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
    this.global.WritableStream = WritableStream;
    this.global.ReadableStream = ReadableStream;
    this.global.Headers = Headers;
    this.global.Request = Request;
    this.global.Response = Response;
  }
}

module.exports = Node18Environment;
