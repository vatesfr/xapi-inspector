#!/usr/bin/env node

import chalk from "chalk";
import eventToPromise from "event-to-promise";
import execPromise from "exec-promise";
import getStream from "get-stream";
import minimist from "minimist";
import { create as createHttpServer } from "http-server-plus";
import { inspect } from "util";
import { load as loadConfig } from "app-conf";
import { parse } from "json-rpc-protocol";
import { readFile } from "fs-promise";

import { name as pkgName, version as pkgVersion } from "../package.json";

import { createReadableCopies, proxyHttpsRequest, splitHost } from "./utils";
import { isXmlRpcRequest, parseRequest } from "./xml-rpc";

// ===================================================================

const paintArg = chalk.yellow;

const requiredArg = name => {
  const message = `Missing argument: <${paintArg(name)}>`;

  throw message;
};

const invalidArg = (name, value) => {
  const message = `Invalid value ${chalk.bold(value)} for argument: <${paintArg(
    name
  )}>`;

  throw message;
};

// ===================================================================

const COMMANDS = {
  async proxy(args) {
    let {
      bind = "0",
      _: [remote = requiredArg("remote address")],
    } = minimist(args, {
      string: "bind",
    });

    bind = {
      cert: await readFile(`${__dirname}/../cert.pem`),
      key: await readFile(`${__dirname}/../key.pem`),
      ...splitHost(bind),
    };
    remote = {
      protocol: "https:",
      ...splitHost(remote),
    };

    // ---------------------------------

    const logRpcCall = (url, method, params) =>
      console.log(
        "[%s] %s(%s)",
        chalk.blue(url),
        chalk.bold.red(method),
        inspect(params, {
          colors: true,
          depth: null,
        })
      );

    const handleJsonRpcRequest = async (req, res) => {
      const [req1, req2] = createReadableCopies(2, req);
      const [res1] = createReadableCopies(
        1,
        await proxyHttpsRequest(
          {
            ...req,
            ...remote,
          },
          req1
        )
      );
      res1.pipe(res);

      const { method, params } = parse(await getStream(req2));

      logRpcCall(req.url, method, params);
    };

    const handleRequest = async (req, res) => {
      console.log("[%s] - Not XML-RPC", chalk.blue(req.url));

      await proxyHttpsRequest(remote, req).pipe(res);
    };

    const handleXmlRpcRequest = async (req, res) => {
      const [req1, req2] = createReadableCopies(2, req);
      const [res1] = createReadableCopies(
        1,
        await proxyHttpsRequest(
          {
            ...req,
            ...remote,
          },
          req1
        )
      );
      res1.pipe(res);

      const { method, params } = await parseRequest(req2);
      logRpcCall(req.url, method, params);
    };

    // ---------------------------------

    const server = createHttpServer(async (req, res) => {
      try {
        if (req.url.startsWith("/jsonrpc")) {
          await handleJsonRpcRequest(req, res);
        } else if (isXmlRpcRequest(req, res)) {
          await handleXmlRpcRequest(req, res);
        } else {
          await handleRequest(req, res);
        }
      } catch (error) {
        console.error(error.stack || error);

        throw error;
      }
    });

    console.log(await server.listen(bind));

    await eventToPromise(server, "close");
  },
};

// ===================================================================

const usage = `Usage: ${pkgName} proxy [--bind <local address>] <remote address>

  Create a XML-RPC proxy which forward requests from <local address>
  to <remote address>.

  <local address>:  [<hostname>]:<port>
  <remote address>: <hostname>[:<port = 443>]

${pkgName} v${pkgVersion}
`.replace(/<([^>]+)>/g, (_, arg) => `<${paintArg(arg)}>`);

execPromise(async args => {
  const { help = false, _: restArgs, "--": restRestArgs } = minimist(args, {
    boolean: "help",
    alias: {
      help: "h",
    },
    stopEarly: true,
    "--": true,
  });

  if (help) {
    return usage;
  }

  // Work around https://github.com/substack/minimist/issues/71
  restArgs.push("--");
  [].push.apply(restArgs, restRestArgs);

  const [commandName, ...commandArgs] = restArgs;

  if (commandName === "--") {
    throw usage;
  }

  const command = COMMANDS[commandName];
  if (!command) {
    invalidArg("command", commandName);
  }

  return command.call(
    {
      config: await loadConfig("xapi-inspector"),
    },
    commandArgs
  );
});
