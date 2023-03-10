import Deserializer from "xmlrpc/lib/deserializer.js";

// ===================================================================

export const isXmlRpcRequest = ({ headers }) =>
  headers["content-type"] === "text/xml";

// -------------------------------------------------------------------

export const parseRequest = (stream) =>
  new Promise((resolve, reject) => {
    new Deserializer().deserializeMethodCall(stream, (error, method, params) =>
      error ? reject(error) : resolve({ method, params })
    );
  });

export const parseResponse = (stream) =>
  new Promise((resolve, reject) => {
    new Deserializer().deserializeMethodResponse(stream, (error, result) =>
      error ? reject(error) : resolve(result)
    );
  });
